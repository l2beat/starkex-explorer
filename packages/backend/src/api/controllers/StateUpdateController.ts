import {
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
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
    private accountService: AccountService,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getStateUpdatesPage(
    page: number,
    perPage: number,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, stateUpdates] = await Promise.all([
      this.accountService.getAccount(address),
      this.stateUpdateRepository.getPaginated({
        offset: (page - 1) * perPage,
        limit: perPage,
      }),
    ])
    const total = await this.stateUpdateRepository.count()

    const content = renderStateUpdatesIndexPage({
      account,
      stateUpdates: stateUpdates.map(toStateUpdateEntry),
      total: Number(total),
      params: { page, perPage },
    })
    return { type: 'success', content }
  }

  async getStateUpdateDetailsPage(
    id: number,
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const [account, stateUpdate, transactions] = await Promise.all([
      this.accountService.getAccount(address),
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
    starkKey: position.starkKey,
    positionId: position.positionId,
    totalUSDCents,
    previousTotalUSDCents,
    assetsUpdated,
  }
}
