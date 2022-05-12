import { renderHomePage } from '@explorer/frontend'
import { EthereumAddress } from '@explorer/types'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { PositionRepository } from '../../peripherals/database/PositionRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'
import { toStateUpdateEntry } from './utils/toStateUpdateEntry'

export class HomeController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
    private positionRepository: PositionRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getHomePage(
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const offset = 0
    const limit = 5

    const [stateUpdates, transactions, totalUpdates, totalPositions] =
      await Promise.all([
        this.stateUpdateRepository.getStateUpdateList({ offset, limit }),
        this.forcedTransactionsRepository.getLatest({ limit, offset }),
        this.stateUpdateRepository.countStateUpdates(),
        this.positionRepository.count(),
      ])

    const content = renderHomePage({
      account,
      stateUpdates: stateUpdates.map(toStateUpdateEntry),
      forcedTransactions: transactions.map(toForcedTransactionEntry),
      totalUpdates,
      totalPositions,
    })
    return { type: 'success', content }
  }
}
