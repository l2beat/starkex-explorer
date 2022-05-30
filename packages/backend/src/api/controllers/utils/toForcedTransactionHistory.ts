import { Timestamp } from '@explorer/types'

import { ForcedTransactionRecord } from '../../../peripherals/database/ForcedTransactionsRepository'

interface Event {
  timestamp: Timestamp
  text: string
}

export function toForcedTransactionHistory({
  updates,
}: ForcedTransactionRecord) {
  const history: Event[] = []
  if (updates.sentAt) {
    history.push({ text: 'transaction sent', timestamp: updates.sentAt })
  }
  if (updates.revertedAt) {
    history.push({
      text: 'transaction reverted',
      timestamp: updates.revertedAt,
    })
    return history
  }
  if (updates.minedAt) {
    history.push({
      text: 'transaction mined (waiting for inclusion in state update)',
      timestamp: updates.minedAt,
    })
  }
  if (updates.verified) {
    history.push({
      text: `exit included in state update #${updates.verified.stateUpdateId}`,
      timestamp: updates.verified.at,
    })
  }
  return history
}
