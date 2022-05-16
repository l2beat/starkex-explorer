import {
  renderForcedTransactionDetailsPage,
  renderForcedTransactionsIndexPage,
  TransactionStatusEntry,
} from '@explorer/frontend'
import { EthereumAddress, Hash256 } from '@explorer/types'

import {
  ForcedTransactionRecord,
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

    if (transaction.data.type === 'trade') {
      throw new Error('Rendering trades not implemented yet')
    }

    const registrationEvent =
      await this.userRegistrationEventRepository.findByStarkKey(
        transaction.data.publicKey
      )

    const content = renderForcedTransactionDetailsPage({
      account,
      history: buildTransactionHistory(transaction),
      ethereumAddress: registrationEvent?.ethAddress,
      positionId: transaction.data.positionId,
      transactionHash,
      value: transaction.data.amount,
      stateUpdateId: transaction.updates.verified?.stateUpdateId,
    })
    return { type: 'success', content }
  }
}

function buildTransactionHistory({
  updates,
}: ForcedTransactionRecord): TransactionStatusEntry[] {
  const history: TransactionStatusEntry[] = []
  if (updates.sentAt) {
    history.push({ type: 'sent', timestamp: updates.sentAt })
  }
  if (updates.revertedAt) {
    history.push({ type: 'reverted', timestamp: updates.revertedAt })
    return history
  }
  if (updates.minedAt) {
    history.push({ type: 'mined', timestamp: updates.minedAt })
  }
  if (updates.verified) {
    history.push({
      type: 'verified',
      stateUpdateId: updates.verified.stateUpdateId,
      timestamp: updates.verified.at,
    })
  }
  return history
}
