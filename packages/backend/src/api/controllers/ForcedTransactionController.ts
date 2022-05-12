import {
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  TransactionStatusEntry,
} from '@explorer/frontend'
import { EthereumAddress, Hash256 } from '@explorer/types'

import {
  ForcedTransaction,
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
    const transaction = await this.forcedTransactionsRepository.findByHash(
      transactionHash
    )
    if (!transaction) {
      const content = 'Could not find transaction for that hash'
      return { type: 'not found', content }
    }

    if (transaction.type === 'trade') {
      throw new Error('Rendering trades not implemented yet')
    }

    const registrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(
        transaction.publicKey
      )

    const content = renderForcedTransactionDetailsPage({
      account,
      history: buildTransactionHistory(transaction),
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

function buildTransactionHistory(
  transaction: ForcedTransaction
): TransactionStatusEntry[] {
  const history: TransactionStatusEntry[] = []
  if (transaction.sentAt) {
    history.push({ type: 'sent', timestamp: transaction.sentAt })
  }
  switch (transaction.status) {
    case 'mined':
      history.push({ type: 'mined', timestamp: transaction.minedAt })
      break
    case 'verified':
      history.push(
        { type: 'mined', timestamp: transaction.minedAt },
        {
          type: 'verified',
          stateUpdateId: transaction.stateUpdateId,
          timestamp: transaction.minedAt,
        }
      )
      break
    case 'reverted':
      history.push({ type: 'reverted', timestamp: transaction.revertedAt })
      break
  }
  return history
}
