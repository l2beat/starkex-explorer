import { renderHomePage, renderHomeStateUpdatesPage } from '@explorer/frontend'
import { UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import { UserService } from '../../core/UserService'
import { PaginationOptions } from '../../model/PaginationOptions'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'

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

    const [totalStateUpdates, stateUpdates] = await Promise.all([
      this.stateUpdateRepository.count(),
      this.stateUpdateRepository.getPaginated({ offset: 0, limit: 6 }),
    ])

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
      transactions: [],
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
        // TODO: we want fact hash instead
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
