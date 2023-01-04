import { ForcedTransactionEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import { getTransactionStatus } from '../../../core/getForcedTransactionStatus'
import { ForcedTransactionRecord } from '../../../peripherals/database/ForcedTransactionRepository'

export function toForcedTransactionEntry(
  transaction: ForcedTransactionRecord
): ForcedTransactionEntry {
  return {
    type:
      transaction.data.type === 'withdrawal'
        ? 'exit'
        : transaction.data.isABuyingSynthetic
        ? 'buy'
        : 'sell',
    status: getTransactionStatus(transaction),
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
