import {
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import {
  PositionRepository,
  PositionWithPricesRecord,
} from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { countUpdatedAssets } from './utils/countUpdatedAssets'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toPositionAssetEntries } from './utils/toPositionAssetEntries'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class StateUpdateController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getStateUpdatesPage(
    page: number,
    perPage: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const stateUpdates = await this.stateUpdateRepository.getPaginated({
      offset: (page - 1) * perPage,
      limit: perPage,
    })
    const fullCount = await this.stateUpdateRepository.count()

    const content = renderStateUpdatesIndexPage({
      account,
      stateUpdates: stateUpdates.map(toStateUpdateEntry),
      fullCount: Number(fullCount),
      params: { page, perPage },
    })
    return { type: 'success', content }
  }

  async getStateUpdateDetailsPage(
    id: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [stateUpdate, transactions] = await Promise.all([
      this.stateUpdateRepository.findByIdWithPositions(id),
      this.forcedTransactionsRepository.getIncludedInStateUpdate(id),
    ])

    if (!stateUpdate) {
      const content = 'State update not found'
      return { type: 'not found', content }
    }

    const previousPositions = await this.positionRepository.getPreviousStates(
      stateUpdate.positions.map((p) => p.positionId),
      id
    )

    const positions = stateUpdate.positions
      .map((position) => ({
        position,
        previous: previousPositions.find(
          (x) => x.positionId === position.positionId
        ),
      }))
      .map(({ position, previous }) =>
        toPositionUpdateEntry(position, previous)
      )

    const content = renderStateUpdateDetailsPage({
      account,
      id: stateUpdate.id,
      hash: stateUpdate.hash,
      rootHash: stateUpdate.rootHash,
      blockNumber: stateUpdate.blockNumber,
      timestamp: stateUpdate.timestamp,
      positions,
      transactions: transactions.map(toForcedTransactionEntry),
    })
    return { type: 'success', content }
  }
}

export function toPositionUpdateEntry(
  position: PositionWithPricesRecord,
  previous: PositionWithPricesRecord | undefined
) {
  const assets = toPositionAssetEntries(
    position.balances,
    position.collateralBalance,
    position.prices
  )
  const totalUSDCents = assets.reduce(
    (total, { totalUSDCents }) => totalUSDCents + total,
    0n
  )
  const previousAssets =
    previous &&
    toPositionAssetEntries(
      previous.balances,
      previous.collateralBalance,
      previous.prices
    )
  const previousTotalUSDCents = previousAssets?.reduce(
    (total, { totalUSDCents }) => totalUSDCents + total,
    0n
  )
  const assetsUpdated = previous
    ? countUpdatedAssets(previous.balances, position.balances)
    : 0

  return {
    publicKey: position.publicKey,
    positionId: position.positionId,
    totalUSDCents,
    previousTotalUSDCents,
    assetsUpdated,
  }
}
