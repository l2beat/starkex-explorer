import {
  PositionUpdateEntry,
  renderStateUpdateDetailsPage,
  renderStateUpdatesIndexPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import {
  ForcedTransactionRecord,
  ForcedTransactionsRepository,
} from '../../peripherals/database/ForcedTransactionsRepository'
import { PositionWithPricesRecord } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toPositionAssetEntries } from './utils/toPositionAssetEntries'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class StateUpdateController {
  constructor(
    private accountService: AccountService,
    private stateUpdateRepository: StateUpdateRepository,
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

    const positions = stateUpdate.positions.map((position) =>
      toPositionUpdateEntry(position, transactions)
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
  transactions: ForcedTransactionRecord[]
): PositionUpdateEntry {
  const assets = toPositionAssetEntries(
    position.balances,
    position.collateralBalance,
    position.prices
  )
  const totalUSDCents = assets.reduce(
    (total, { totalUSDCents }) => totalUSDCents + total,
    0n
  )

  const forcedTransactions = transactions.filter((tx) => {
    if (tx.data.type === 'withdrawal') {
      return tx.data.positionId === position.positionId
    } else {
      return (
        tx.data.positionIdA === position.positionId ||
        tx.data.positionIdB === position.positionId
      )
    }
  }).length

  return {
    starkKey: position.starkKey,
    positionId: position.positionId,
    collateralBalance: position.collateralBalance,
    totalUSDCents,
    forcedTransactions,
  }
}
