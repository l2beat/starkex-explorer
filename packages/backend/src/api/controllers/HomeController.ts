import { renderOldHomePage } from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { AccountService } from '../../core/AccountService'
import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { UserTransactionRepository } from '../../peripherals/database/transactions/UserTransactionRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTradeOfferEntry } from './utils/toForcedTradeOfferEntry'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class HomeController {
  constructor(
    private accountService: AccountService,
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private userTransactionRepository: UserTransactionRepository,
    private forcedTradeOffersRepository: ForcedTradeOfferRepository
  ) {}

  async getHomePage(
    address: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const offset = 0
    const limit = 5

    const [
      account,
      stateUpdates,
      transactions,
      offers,
      totalUpdates,
      totalPositions,
    ] = await Promise.all([
      this.accountService.getAccount(address),
      this.stateUpdateRepository.getPaginated({ offset, limit }),
      this.userTransactionRepository.getPaginated({
        limit,
        offset,
        types: ['ForcedTrade', 'ForcedWithdrawal'],
      }),
      this.forcedTradeOffersRepository.getInitial({ limit, offset }),
      this.stateUpdateRepository.count(),
      this.positionRepository.count(),
    ])

    const content = renderOldHomePage({
      account,
      stateUpdates: stateUpdates.map(toStateUpdateEntry),
      forcedTransactions: transactions.map(toForcedTransactionEntry),
      totalUpdates,
      totalPositions,
      forcedTradeOffers: offers.map(toForcedTradeOfferEntry),
    })
    return { type: 'success', content }
  }
}
