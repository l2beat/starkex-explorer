import { ForcedTransactionEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import { ForcedTransactionRecord } from '../../../peripherals/database/ForcedTransactionsRepository'

export function toForcedTransactionEntry(
  transaction: ForcedTransactionRecord
): ForcedTransactionEntry {
  let status: ForcedTransactionEntry['status'] = 'sent'
  if (transaction.updates.verified) {
    status = 'completed'
  } else if (transaction.updates.minedAt) {
    status = 'waiting to be included'
  } else if (transaction.updates.revertedAt) {
    status = 'reverted'
  }

  return {
    type:
      transaction.data.type === 'withdrawal'
        ? 'exit'
        : transaction.data.isABuyingSynthetic
        ? 'buy'
        : 'sell',
    status,
    hash: transaction.hash,
    lastUpdate: transaction.lastUpdateAt,
    amount:
      transaction.data.type === 'trade'
        ? transaction.data.syntheticAmount
        : transaction.data.amount,
    assetId:
      transaction.data.type === 'trade'
        ? transaction.data.syntheticAssetId
        : AssetId.USDC,
    positionId:
      transaction.data.type === 'trade'
        ? transaction.data.positionIdA
        : transaction.data.positionId,
  }
}
