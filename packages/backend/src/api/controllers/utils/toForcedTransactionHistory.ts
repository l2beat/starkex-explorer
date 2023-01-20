import { Timestamp } from '@explorer/types'

import { SentTransactionRecord } from '../../../peripherals/database/transactions/SentTransactionRepository'
import { UserTransactionRecord } from '../../../peripherals/database/transactions/UserTransactionRepository'

interface Event {
  timestamp: Timestamp
  text: string
}

export function toForcedTransactionHistory(
  sentTransaction: SentTransactionRecord | undefined,
  transaction:
    | UserTransactionRecord<'ForcedTrade' | 'ForcedWithdrawal'>
    | undefined,
  sentWithdrawal: SentTransactionRecord | undefined
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
  if (sentWithdrawal) {
    history.push({
      text: 'finalize transaction sent',
      timestamp: sentWithdrawal.sentTimestamp,
    })
  }
  if (sentWithdrawal?.mined) {
    if (sentWithdrawal.mined.reverted) {
      history.push({
        text: 'finalize transaction reverted',
        timestamp: sentWithdrawal.mined.timestamp,
      })
    } else {
      history.push({
        text: 'finalize transaction mined',
        timestamp: sentWithdrawal.mined.timestamp,
      })
    }
  }
  return history
}
