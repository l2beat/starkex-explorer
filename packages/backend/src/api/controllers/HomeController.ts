import {
  HomeForcedTransactionEntry,
  renderHomePage,
  renderHomeStateUpdatesPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { AssetId, Hash256 } from '@explorer/types'

import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import {
  UserTransactionRecord,
  UserTransactionRepository,
} from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'

const FORCED_TRANSACTION_TYPES = [
  'ForcedTrade' as const,
  'ForcedWithdrawal' as const,
  'FullWithdrawal' as const,
]

export class HomeController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private userTransactionRepository: UserTransactionRepository
  ) {}

  async getHomePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [totalStateUpdates, stateUpdates, userTransactions] =
      await Promise.all([
        this.stateUpdateRepository.count(),
        this.stateUpdateRepository.getPaginated({ offset: 0, limit: 6 }),
        this.userTransactionRepository.getPaginated({
          offset: 0,
          limit: 6,
          types: FORCED_TRANSACTION_TYPES,
        }),
      ])

    const userTransactionEntries =
      toUserTransactionEntries(userTransactions).filter(Boolean) // TODO. removing undefined - this should not be necessary

    const content = renderHomePage({
      user,
      tutorials: [], // explicitly no tutorials
      stateUpdates: stateUpdates.map((update) => ({
        timestamp: update.timestamp,
        id: update.id.toString(),
        // we want fact hash instead
        hash: Hash256(update.rootHash.toString()),
        updateCount: update.positionCount,
        forcedTransactionCount: update.forcedTransactionsCount,
      })),
      totalStateUpdates,
      forcedTransactions: userTransactionEntries,
      totalForcedTransactions: 0,
      offers: [],
      totalOffers: 0,
    })
    return { type: 'success', content }
  }

  async getHomeStateUpdatesPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [total, stateUpdates] = await Promise.all([
      this.stateUpdateRepository.count(),
      this.stateUpdateRepository.getPaginated(pagination),
    ])

    const content = renderHomeStateUpdatesPage({
      user,
      stateUpdates: stateUpdates.map((update) => ({
        timestamp: update.timestamp,
        id: update.id.toString(),
        // we want fact hash instead
        hash: Hash256(update.rootHash.toString()),
        updateCount: update.positionCount,
        forcedTransactionCount: update.forcedTransactionsCount,
      })),
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }
}

function toUserTransactionEntries(
  records: UserTransactionRecord<typeof FORCED_TRANSACTION_TYPES[number]>[]
): HomeForcedTransactionEntry[] {
  return records.map((record) => {
    const data = record.data
    switch (data.type) {
      case 'ForcedTrade':
        return {
          timestamp: record.timestamp,
          hash: record.transactionHash,
          asset: { hashOrId: data.syntheticAssetId },
          amount: data.syntheticAmount,
          status: record.included ? 'INCLUDED' : 'MINED',
          type: data.isABuyingSynthetic ? 'BUY' : 'SELL',
        }
      case 'ForcedWithdrawal':
        return {
          timestamp: record.timestamp,
          hash: record.transactionHash,
          // TODO: not always USDC
          asset: { hashOrId: AssetId.USDC },
          amount: data.quantizedAmount,
          status: record.included ? 'INCLUDED' : 'MINED',
          type: 'WITHDRAW',
        }
      case 'FullWithdrawal':
        // TODO: assets, amount is unknown
        throw new Error('Not implemented')

      // TODO: other types return undefined....
    }
  })
}
