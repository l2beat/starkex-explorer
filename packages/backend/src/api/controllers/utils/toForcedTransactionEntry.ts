import { ForcedTransactionEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import { ForcedTransaction } from '../../../peripherals/database/ForcedTransactionsRepository'

export function toForcedTransactionEntry(
  transaction: ForcedTransaction
): ForcedTransactionEntry {
  return {
    type:
      transaction.type === 'withdrawal'
        ? 'exit'
        : transaction.isABuyingSynthetic
        ? 'buy'
        : 'sell',
    status:
      transaction.status === 'mined' ? 'waiting to be included' : 'completed',
    hash: transaction.hash,
    lastUpdate: transaction.lastUpdate,
    amount:
      transaction.type === 'trade'
        ? transaction.syntheticAmount
        : transaction.amount,
    assetId:
      transaction.type === 'trade'
        ? transaction.syntheticAssetId
        : AssetId('USDC-1'),
    positionId:
      transaction.type === 'trade'
        ? transaction.positionIdA
        : transaction.positionId,
  }
}
