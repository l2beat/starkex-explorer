import { renderHomePage, StateUpdateEntry } from '@explorer/frontend'
import { EthereumAddress, PedersenHash, Timestamp } from '@explorer/types'

import { ForcedTransactionsRepository } from '../../peripherals/database/ForcedTransactionsRepository'
import { StateUpdateRepository } from '../../peripherals/database/StateUpdateRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTransactionEntry } from './toForcedTransactionEntry'

export class HomeController {
  constructor(
    private stateUpdateRepository: StateUpdateRepository,
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
        this.stateUpdateRepository.countPositions(),
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

export function toStateUpdateEntry(stateUpdate: {
  id: number
  rootHash: PedersenHash
  timestamp: Timestamp
  positionCount: number
}): StateUpdateEntry {
  return {
    id: stateUpdate.id,
    hash: stateUpdate.rootHash,
    timestamp: stateUpdate.timestamp,
    positionCount: stateUpdate.positionCount,
  }
}
