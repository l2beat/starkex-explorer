import { TransactionStatus } from '@explorer/frontend'

import { ForcedTransactionRecord } from '../peripherals/database/ForcedTransactionRepository'

export function getTransactionStatus(
  transaction: ForcedTransactionRecord
): TransactionStatus {
  if (transaction.updates.finalized?.minedAt) {
    return 'finalized'
  }
  if (transaction.updates.finalized?.forgottenAt) {
    return 'finalize forgotten'
  }
  if (transaction.updates.finalized?.revertedAt) {
    return 'finalize reverted'
  }
  if (transaction.updates.finalized?.sentAt) {
    return 'finalize sent'
  }
  if (transaction.updates.verified) {
    return 'verified'
  }
  if (transaction.updates.minedAt) {
    return 'mined'
  }
  if (transaction.updates.forgottenAt) {
    return 'forgotten'
  }
  if (transaction.updates.revertedAt) {
    return 'reverted'
  }
  return 'sent'
}
