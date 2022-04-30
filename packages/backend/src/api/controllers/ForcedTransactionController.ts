import {
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  TransactionStatusEntry,
} from '@explorer/frontend'
import { EthereumAddress, Hash256 } from '@explorer/types'

import {
  EventRecord,
  ForcedTransactionsRepository,
} from '../../peripherals/database/ForcedTransactionsRepository'
import { UserRegistrationEventRepository } from '../../peripherals/database/UserRegistrationEventRepository'
import { ControllerResult } from './ControllerResult'
import { toForcedTransactionEntry } from './utils/toForcedTransactionEntry'

export class ForcedTransactionController {
  constructor(
    private userRegistrationEventRepository: UserRegistrationEventRepository,
    private forcedTransactionsRepository: ForcedTransactionsRepository
  ) {}

  async getForcedTransactionsPage(
    page: number,
    perPage: number,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const limit = perPage
    const offset = (page - 1) * perPage
    const [transactions, fullCount] = await Promise.all([
      this.forcedTransactionsRepository.getLatest({ limit, offset }),
      this.forcedTransactionsRepository.countAll(),
    ])

    const content = renderForcedTransactionsIndexPage({
      account,
      transactions: transactions.map(toForcedTransactionEntry),
      fullCount,
      params: { page, perPage },
    })
    return { type: 'success', content }
  }

  async getForcedTransactionDetailsPage(
    transactionHash: Hash256,
    account: EthereumAddress | undefined
  ): Promise<ControllerResult> {
    const result = await this.forcedTransactionsRepository.getByHashWithEvents(
      transactionHash
    )
    if (!result) {
      const content = 'Could not find transaction for that hash'
      return { type: 'not found', content }
    }

    const { transaction, events } = result

    if (transaction.type === 'trade') {
      throw new Error('Rendering trades not implemented yet')
    }

    const registrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(
        transaction.publicKey
      )

    const content = renderForcedTransactionDetailsPage({
      account,
      history: events.map(toTransactionStatusEntry),
      ethereumAddress: registrationEvent?.ethAddress,
      positionId: transaction.positionId,
      transactionHash,
      value: transaction.amount,
      stateUpdateId:
        transaction.status === 'verified'
          ? transaction.stateUpdateId
          : undefined,
    })
    return { type: 'success', content }
  }
}

function toTransactionStatusEntry(event: EventRecord): TransactionStatusEntry {
  switch (event.eventType) {
    case 'mined':
      return { type: 'mined', timestamp: event.timestamp }
    case 'verified':
      return {
        type: 'verified',
        stateUpdateId: event.stateUpdateId,
        timestamp: event.timestamp,
      }
  }
}
