import { Hash256, Timestamp } from '@explorer/types'

import { SentTransactionRecord } from '../../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../../../peripherals/database/transactions/UserTransactionRepository'

interface Event {
  timestamp: Timestamp
  text: string
}

export interface FinalizeTransaction {
  transactionHash: Hash256
  reverted: boolean
  sentTimestamp: Timestamp | undefined
  minedTimestamp: Timestamp | undefined
}

export function toForcedTransactionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  transaction:
    | UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>
    | undefined,
  finalize: FinalizeTransaction | undefined
) {
  const history: Event[] = []
  if (sentTransaction) {
    history.push({
      text: 'transaction sent',
      timestamp: sentTransaction.sentTimestamp,
    })
  }
  if (sentTransaction?.mined?.reverted) {
    history.push({
      text: 'transaction reverted',
      timestamp: sentTransaction.mined.timestamp,
    })
    return history
  }
  if (transaction) {
    history.push({
      text: 'transaction mined (waiting for inclusion in state update)',
      timestamp: transaction.timestamp,
    })
  }
  if (transaction?.included) {
    history.push({
      text: `exit included in state update #${transaction.included.stateUpdateId}`,
      timestamp: transaction.included.timestamp,
    })
  }
  if (finalize?.sentTimestamp) {
    history.push({
      text: 'finalize transaction sent',
      timestamp: finalize.sentTimestamp,
    })
  }
  if (finalize?.minedTimestamp) {
    if (finalize.reverted) {
      history.push({
        text: 'finalize transaction reverted',
        timestamp: finalize.minedTimestamp,
      })
    } else {
      history.push({
        text: 'finalize transaction mined',
        timestamp: finalize.minedTimestamp,
      })
    }
  }
  return history
}
