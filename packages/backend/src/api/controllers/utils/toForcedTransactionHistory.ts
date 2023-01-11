import { Timestamp } from '@explorer/types'

import { ForcedTransactionRecord } from '../../../peripherals/database/ForcedTransactionRepository'

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
  if (updates.finalized?.sentAt) {
    history.push({
      text: 'finalize transaction sent',
      timestamp: updates.finalized.sentAt,
    })
  }
  if (updates.finalized?.revertedAt) {
    history.push({
      text: 'finalize transaction reverted',
      timestamp: updates.finalized.revertedAt,
    })
  }
  if (updates.finalized?.minedAt) {
    history.push({
      text: 'finalize transaction mined',
      timestamp: updates.finalized.minedAt,
    })
  }
  return history
}
