import {
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import {
  PositionWithPricesRecord,
  StateUpdateRepository,
} from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { applyAssetPrices } from './utils/applyAssetPrices'
import { countUpdatedAssets } from './utils/countUpdatedAssets'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class StateUpdateController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getStateUpdatesPage(
    page: number,
    perPage: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const stateUpdates = await this.stateUpdateRepository.getStateUpdateList({
      offset: (page - 1) * perPage,
      limit: perPage,
    })
    const fullCount = await this.stateUpdateRepository.getStateUpdateCount()

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
      this.stateUpdateRepository.getStateUpdateById(id),
      this.forcedTransactionsRepository.getIncludedInStateUpdate(id),
    ])

    if (!stateUpdate) {
      const content = 'State update not found'
      return { type: 'not found', content }
    }

    const previousPositions =
      await this.stateUpdateRepository.getPositionsPreviousState(
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
  const assets = applyAssetPrices(
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
    applyAssetPrices(
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
