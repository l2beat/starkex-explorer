import { Timestamp } from '@explorer/types'

import { ForcedTransactionRecord } from '../../../peripherals/database/ForcedTransactionsRepository'

export function toForcedTransactionHistory({
  updates,
}: ForcedTransactionRecord): { timestamp: Timestamp; text: string }[] {
  const history: { timestamp: Timestamp; text: string }[] = []
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
