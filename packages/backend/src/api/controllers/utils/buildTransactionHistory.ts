import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../../peripherals/database/ForcedTradeOfferRepository'
import { SentTransactionRecord } from '../../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../../../peripherals/database/transactions/UserTransactionRepository'

type TransactionStatus =
  | 'CREATED'
  | 'CANCELLED'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'SENT'
  | 'REVERTED'
  | 'MINED'
  | 'INCLUDED'

interface TransactionHistoryItem<
  T extends TransactionStatus = TransactionStatus
> {
  timestamp: Timestamp | undefined
  status: T
}

interface TransactionHistoryArgs {
  userTransaction?: UserTransactionRecord
  sentTransaction?: SentTransactionRecord
  forcedTradeOffer?: ForcedTradeOfferRecord
}

export function buildRegularTransactionHistory({
  sentTransaction,
  userTransaction,
  forcedTradeOffer,
}: TransactionHistoryArgs) {
  const history: TransactionHistoryItem<'SENT' | 'REVERTED' | 'MINED'>[] = []

  if (sentTransaction?.mined || userTransaction) {
    if (sentTransaction?.mined?.reverted) {
      history.push({
        timestamp: sentTransaction.mined.timestamp,
        status: 'REVERTED',
      })
    } else {
      history.push({
        status: 'MINED',
        timestamp:
          // is that correct?
          sentTransaction?.mined?.timestamp ?? userTransaction?.timestamp,
      })
    }
  }

  if (
    forcedTradeOffer?.accepted?.transactionHash ||
    sentTransaction ||
    userTransaction
  ) {
    history.push({
      timestamp: sentTransaction?.sentTimestamp,
      status: 'SENT',
    })
  }

  return history
}

export function buildForcedTransactionHistory({
  sentTransaction,
  userTransaction,
  forcedTradeOffer,
}: TransactionHistoryArgs) {
  const history: TransactionHistoryItem<
    'SENT' | 'REVERTED' | 'MINED' | 'INCLUDED'
  >[] = []

  if (userTransaction?.included) {
    history.push({
      timestamp: userTransaction.included.timestamp,
      status: 'INCLUDED',
    })
  }

  history.push(
    ...buildRegularTransactionHistory({
      sentTransaction,
      userTransaction,
      forcedTradeOffer,
    })
  )

  return history
}

export function buildForcedTradeTransactionHistory({
  forcedTradeOffer,
  sentTransaction,
  userTransaction,
}: TransactionHistoryArgs) {
  const history: TransactionHistoryItem[] = [
    ...buildForcedTransactionHistory({ sentTransaction, userTransaction }),
  ]

  if (!forcedTradeOffer && !sentTransaction && !userTransaction) {
    return history
  }

  if (forcedTradeOffer?.cancelledAt) {
    history.push({
      timestamp: forcedTradeOffer.cancelledAt,
      status: 'CANCELLED',
    })
  }
  if (forcedTradeOffer?.accepted?.at || sentTransaction || userTransaction) {
    if (
      forcedTradeOffer?.accepted?.submissionExpirationTime &&
      forcedTradeOffer.accepted.submissionExpirationTime < Timestamp.now()
    ) {
      history.push({
        timestamp: forcedTradeOffer.accepted.submissionExpirationTime,
        status: 'EXPIRED',
      })
    }
    history.push({
      timestamp: forcedTradeOffer?.accepted?.at,
      status: 'ACCEPTED',
    })
  }
  history.push({
    timestamp: forcedTradeOffer?.createdAt,
    status: 'CREATED',
  })

  return history
}
