import {
  renderHomePage,
  renderHomeStateUpdatesPage,
  renderHomeTransactionsPage,
} from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionData } from '../../peripherals/database/transactions/UserTransaction'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { userTransactionToEntry } from './userTransactionToEntry'

const FORCED_TRANSACTION_TYPES: UserTransactionData['type'][] = [
  'ForcedWithdrawal',
  'ForcedTrade',
  'FullWithdrawal',
]

export class HomeController {
  constructor(
    private readonly userService: UserService,
    private readonly stateUpdateRepository: StateUpdateRepository,
    private userTransactionRepository: UserTransactionRepository,
    private readonly collateralAsset?: CollateralAsset
  ) {}

  async getHomePage(
    givenUser: Partial<UserDetails>
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [
      totalStateUpdates,
      stateUpdates,
      forcedUserTransactions,
      forcedUserTransactionsCount,
    ] = await Promise.all([
      this.stateUpdateRepository.count(),
      this.stateUpdateRepository.getPaginated({ offset: 0, limit: 6 }),
      this.userTransactionRepository.getPaginated({
        offset: 0,
        limit: 6,
        types: FORCED_TRANSACTION_TYPES,
      }),
      this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
    ])

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset)
    )

    const content = renderHomePage({
      user,
      tutorials: [], // explicitly no tutorials
      stateUpdates: stateUpdates.map((update) => ({
        timestamp: update.timestamp,
        id: update.id.toString(),
        hash: Hash256.fake('abc'), // TODO: we want fact hash
        updateCount: update.positionCount,
        forcedTransactionCount: update.forcedTransactionsCount,
      })),
      totalStateUpdates,
      transactions,
      totalForcedTransactions: forcedUserTransactionsCount,
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
        hash: Hash256.fake('abc'), // TODO: we want fact hash
        updateCount: update.positionCount,
        forcedTransactionCount: update.forcedTransactionsCount,
      })),
      ...pagination,
      total,
    })
    return { type: 'success', content }
  }

  async getHomeForcedTransactionsPage(
    givenUser: Partial<UserDetails>,
    pagination: PaginationOptions
  ): Promise<ControllerResult> {
    const user = await this.userService.getUserDetails(givenUser)

    const [forcedUserTransactions, forcedUserTransactionsCount] =
      await Promise.all([
        this.userTransactionRepository.getPaginated({
          ...pagination,
          types: FORCED_TRANSACTION_TYPES,
        }),
        this.userTransactionRepository.countAll(FORCED_TRANSACTION_TYPES),
      ])

    const transactions = forcedUserTransactions.map((t) =>
      userTransactionToEntry(t, this.collateralAsset)
    )

    const content = renderHomeTransactionsPage({
      user,
      forcedTransactions: transactions,
      total: forcedUserTransactionsCount,
      ...pagination,
    })

    return { type: 'success', content }
  }
}
