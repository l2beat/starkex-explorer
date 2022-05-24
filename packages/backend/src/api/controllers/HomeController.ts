import { renderHomePage } from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { ForcedTradeOfferRepository } from '../../peripherals/database/ForcedTradeOfferRepository'
import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTradeOfferEntry } from './utils/toForcedTradeOfferEntry'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class HomeController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository,
    private forcedTradeOffersRepository: ForcedTradeOfferRepository
  ) {}

  async getHomePage(
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const offset = 0
    const limit = 5

    const [stateUpdates, transactions, offers, totalUpdates, totalPositions] =
      await Promise.all([
        this.stateUpdateRepository.getPaginated({ offset, limit }),
        this.forcedTransactionsRepository.getLatest({ limit, offset }),
        this.forcedTradeOffersRepository.getInitial({ limit, offset }),
        this.stateUpdateRepository.count(),
        this.positionRepository.count(),
      ])

    const content = renderHomePage({
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
