import {
  PositionUpdateEntry,
  renderOldStateUpdateDetailsPage,
  renderOldStateUpdatesIndexPage,
} from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import { PositionWithPricesRecord } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toPositionAssetEntries } from './utils/toPositionAssetEntries'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class OldStateUpdateController {
  constructor(
    private accountService: AccountService,
    private stateUpdateRepository: StateUpdateRepository,
    private userTransactionRepository: UserTransactionRepository
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

    const content = renderOldStateUpdatesIndexPage({
      account,
      stateUpdates: stateUpdates.map(toStateUpdateEntry),
      total,
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
      this.userTransactionRepository.getByStateUpdateId(id, [
        'ForcedTrade',
        'ForcedWithdrawal',
      ]),
    ])

    if (!stateUpdate) {
      const content = 'State update not found'
      return { type: 'not found', content }
    }

    const positions = stateUpdate.positions.map((position) =>
      toPositionUpdateEntry(position, transactions)
    )

    const content = renderOldStateUpdateDetailsPage({
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
  transactions: UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>[]
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
    if (tx.data.type === 'ForcedWithdrawal') {
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
