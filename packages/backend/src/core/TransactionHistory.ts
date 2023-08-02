import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRecord } from '../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../peripherals/database/transactions/UserTransactionRepository'

type TransactionStatus =
  | 'CREATED'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'SENT'
  | 'REVERTED'
  | 'MINED'
  | 'INCLUDED'

export interface TransactionHistoryItem<
  T extends TransactionStatus = TransactionStatus
> {
  // Timestamp may be undefined if i.e. forced trade offer was not initiated with our explorer.
  // We assume that the offer had been "CREATED" but we do not know when.
  timestamp: Timestamp | undefined
  status: T
}

interface Transactions {
  userTransaction?: UserTransactionRecord
  sentTransaction?: SentTransactionRecord
  forcedTradeOffer?: ForcedTradeOfferRecord
}

export class TransactionHistory {
  private readonly sentTransaction?: SentTransactionRecord
  private readonly userTransaction?: UserTransactionRecord
  private readonly forcedTradeOffer?: ForcedTradeOfferRecord

  constructor(transactions: Transactions) {
    this.sentTransaction = transactions.sentTransaction
    this.userTransaction = transactions.userTransaction
    this.forcedTradeOffer = transactions.forcedTradeOffer

    if (
      !this.forcedTradeOffer &&
      !this.sentTransaction &&
      !this.userTransaction
    ) {
      throw new Error(
        'TransactionHistory cannot be initialized without at least one transaction'
      )
    }
  }

  getNonRevertableTransactionHistory() {
    const history: TransactionHistoryItem<'SENT' | 'MINED'>[] = []
    if (this.sentTransaction?.mined || this.userTransaction) {
      history.push({
        status: 'MINED',
        timestamp:
          this.sentTransaction?.mined?.timestamp ??
          this.userTransaction?.timestamp,
      })
    }

    if (this.sentTransaction || this.userTransaction) {
      history.push({
        timestamp: this.sentTransaction?.sentTimestamp,
        status: 'SENT',
      })
    }
    return history
  }

  getRegularTransactionHistory() {
    const history: TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] = []

    if (this.sentTransaction?.mined || this.userTransaction) {
      if (this.sentTransaction?.mined?.reverted && !this.userTransaction) {
        history.push({
          timestamp: this.sentTransaction.mined.timestamp,
          status: 'REVERTED',
        })
      } else {
        history.push({
          status: 'MINED',
          timestamp:
            this.sentTransaction?.mined?.timestamp ??
            this.userTransaction?.timestamp,
        })
      }
    }

    if (
      this.forcedTradeOffer?.accepted?.transactionHash ||
      this.sentTransaction ||
      this.userTransaction
    ) {
      history.push({
        timestamp: this.sentTransaction?.sentTimestamp,
        status: 'SENT',
      })
    }

    return history
  }

  getForcedTransactionHistory() {
    const history: TransactionHistoryItem<
      'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
    >[] = []

    if (this.userTransaction?.included) {
      history.push({
        timestamp: this.userTransaction.included.timestamp,
        status: 'INCLUDED',
      })
    }

    history.push(...this.getRegularTransactionHistory())

    return history
  }

  getForcedTradeTransactionHistory() {
    const history: TransactionHistoryItem[] = [
      ...this.getForcedTransactionHistory(),
    ]

    if (this.forcedTradeOffer?.cancelledAt) {
      history.push({
        timestamp: this.forcedTradeOffer.cancelledAt,
        status: 'CANCELLED',
      })
    }
    if (
      this.forcedTradeOffer?.accepted?.at ||
      this.sentTransaction ||
      this.userTransaction
    ) {
      if (
        !this.forcedTradeOffer?.accepted?.transactionHash &&
        this.forcedTradeOffer?.accepted?.submissionExpirationTime &&
        this.forcedTradeOffer.accepted.submissionExpirationTime <
          Timestamp.now()
      ) {
        history.push({
          timestamp: this.forcedTradeOffer.accepted.submissionExpirationTime,
          status: 'EXPIRED',
        })
      }
      history.push({
        timestamp: this.forcedTradeOffer?.accepted?.at,
        status: 'ACCEPTED',
      })
    }
    history.push({
      timestamp: this.forcedTradeOffer?.createdAt,
      status: 'CREATED',
    })

    return history
  }

  getLatestRegularTransactionStatus() {
    const history = this.getRegularTransactionHistory()
    const latestHistoryItem = history[0]

    if (!latestHistoryItem) {
      throw new Error('Transaction history is empty')
    }

    return latestHistoryItem.status
  }

  getLatestForcedTransactionStatus() {
    const history = this.getForcedTransactionHistory()
    const latestHistoryItem = history[0]

    if (!latestHistoryItem) {
      throw new Error('Transaction history is empty')
    }

    return latestHistoryItem.status
  }

  getLatestForcedTradeTransactionStatus() {
    const history = this.getForcedTradeTransactionHistory()
    const latestHistoryItem = history[0]

    if (!latestHistoryItem) {
      throw new Error('Transaction history is empty')
    }

    return latestHistoryItem.status
  }
}
