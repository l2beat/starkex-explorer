import { MerkleProof, PositionLeaf } from '@explorer/state'

import { StateUpdater } from '../../core/StateUpdater'
import { PreprocessedAssetHistoryRepository } from '../../peripherals/database/PreprocessedAssetHistoryRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { calculateEscapePerpetualWithdrawalAmount } from './calculateFrozenWithdrawalAmount'
import { ControllerResult } from './ControllerResult'

export class StatsController {
  constructor(
    private readonly stateUpdater: StateUpdater,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly preprocessedAssetHistoryRepository: PreprocessedAssetHistoryRepository
  ) {}

  async getEscapeWithdrawalAmount(positionOrVaultId: bigint) {
    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )

    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) {
      throw new Error('No state update found to perform escape')
    }
    if (!latestStateUpdate.perpetualState) {
      throw new Error('No perpetual state recorded to perform escape')
    }

    const escapeWitdrawalAmount = calculateEscapePerpetualWithdrawalAmount(
      merkleProof as MerkleProof<PositionLeaf>,
      latestStateUpdate.perpetualState
    )
    const escapeWitdrawalAmountNoFunding =
      calculateEscapePerpetualWithdrawalAmount(
        merkleProof as MerkleProof<PositionLeaf>,
        latestStateUpdate.perpetualState,
        true
      )

    return { escapeWitdrawalAmount, escapeWitdrawalAmountNoFunding }
  }

  async getStatsPage(): Promise<ControllerResult> {
    const allEntries =
      await this.preprocessedAssetHistoryRepository.getAllCurrent()

    const uniquePositionIds = new Set(
      allEntries.map((e) => e.positionOrVaultId)
    )

    const withdrawalAmounts: [bigint, bigint, bigint][] = []
    for (const id of uniquePositionIds) {
      console.log(
        'Progress in percent:',
        (withdrawalAmounts.length / uniquePositionIds.size) * 100
      )
      const { escapeWitdrawalAmount, escapeWitdrawalAmountNoFunding } =
        await this.getEscapeWithdrawalAmount(id)
      withdrawalAmounts.push([
        id,
        escapeWitdrawalAmount,
        escapeWitdrawalAmountNoFunding,
      ])
    }

    const content = withdrawalAmounts
      .map(
        ([id, escapeWitdrawalAmount, escapeWitdrawalAmountNoFunding]) =>
          `${id},${escapeWitdrawalAmount},${escapeWitdrawalAmountNoFunding}`
      )
      .join('\n')

    return { type: 'success', content }
  }
}
