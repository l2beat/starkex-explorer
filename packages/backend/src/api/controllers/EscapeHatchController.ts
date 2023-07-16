import { encodeState } from '@explorer/encoding'
import {
  renderEscapeHatchActionPage,
  renderFreezeRequestActionPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FreezeCheckService } from '../../core/FreezeCheckService'
import { PageContextService } from '../../core/PageContextService'
import { StateUpdater } from '../../core/StateUpdater'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { serializeMerkleProofForEscape } from './serializeMerkleProofForEscape'

export class EscapeHatchController {
  constructor(
    private readonly pageContextService: PageContextService,
    private readonly freezeCheckService: FreezeCheckService,
    private readonly stateUpdater: StateUpdater,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private readonly starkExAddress: EthereumAddress,
    private readonly escapeVerifierAddress: EthereumAddress
  ) {}

  async getFreezeRequestActionPage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'You have to connect your wallet to access this page',
      }
    }

    if (context.freezeStatus !== 'freezable') {
      return {
        type: 'not found',
        message: 'Exchange is not freezable',
      }
    }

    const oldestNotIncludedForcedAction =
      await this.freezeCheckService.findOldestNotIncludedForcedAction()
    if (!oldestNotIncludedForcedAction) {
      return {
        type: 'not found',
        message: 'Freeze is no longer possible',
      }
    }

    if (oldestNotIncludedForcedAction.data.type !== 'ForcedWithdrawal') {
      return {
        type: 'not found',
        message: 'Functionality not yet supported',
      }
    }

    const data = oldestNotIncludedForcedAction.data
    const content = renderFreezeRequestActionPage({
      context,
      transactionHash: oldestNotIncludedForcedAction.transactionHash,
      starkKey: data.starkKey,
      positionOrVaultId: data.positionId,
      quantizedAmount: data.quantizedAmount,
      starkExAddress: this.starkExAddress,
    })

    return { type: 'success', content }
  }

  async getEscapeHatchActionPage(
    givenUser: Partial<UserDetails>,
    positionOrVaultId: bigint
  ): Promise<ControllerResult> {
    const context = await this.pageContextService.getPageContextWithUser(
      givenUser
    )

    if (!context) {
      return {
        type: 'not found',
        message: 'You have to connect your wallet to access this page',
      }
    }

    if (context.freezeStatus !== 'frozen') {
      return {
        type: 'not found',
        message: 'Exchange is not frozen',
      }
    }

    const merkleProof = await this.stateUpdater.generateMerkleProof(
      positionOrVaultId
    )
    const serializedMerkleProof = serializeMerkleProofForEscape(merkleProof)

    const latestStateUpdate = await this.stateUpdateRepository.findLast()
    if (!latestStateUpdate) {
      throw new Error('No state update found to perform escape')
    }
    if (!latestStateUpdate.perpetualState) {
      throw new Error('No perpetual state recorded to perform escape')
    }
    const encodedState = encodeState(latestStateUpdate.perpetualState)
    const serializedState: bigint[] = []
    for (let i = 0; i < encodedState.length / 2 / 32; i++) {
      serializedState.push(
        BigInt('0x' + encodedState.slice(64 * i, 64 * (i + 1)))
      )
    }

    const content = renderEscapeHatchActionPage({
      context,
      escapeVerifierAddress: this.escapeVerifierAddress,
      positionOrVaultId,
      serializedMerkleProof,
      assetCount: merkleProof.perpetualAssetCount,
      serializedState,
    })

    return { type: 'success', content }
  }
}
