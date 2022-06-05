import { TransactionStatus } from '@explorer/frontend'

import { ForcedTransactionRecord } from '../peripherals/database/ForcedTransactionsRepository'

export function getTransactionStatus(
  transaction: ForcedTransactionRecord
): TransactionStatus {
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
