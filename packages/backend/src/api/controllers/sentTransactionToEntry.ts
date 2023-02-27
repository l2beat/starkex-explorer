import { TransactionEntry } from '@explorer/frontend'
import { Asset } from '@explorer/frontend/src/utils/assets'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { SentTransactionRecord } from '../../peripherals/database/transactions/SentTransactionRepository'
import { assertUnreachable } from '../../utils/assertUnreachable'

export function extractSentTxEntryType(
  data: SentTransactionRecord['data']
): TransactionEntry['type'] {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return 'FORCED_WITHDRAW'
    case 'ForcedTrade':
      return data.isABuyingSynthetic ? 'FORCED_BUY' : 'FORCED_SELL'
    case 'Withdraw':
      return 'WITHDRAW'
    default:
      assertUnreachable(data)
  }
}

export function extractSentTxAmount(
  data: SentTransactionRecord['data']
): bigint | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return data.quantizedAmount
    case 'ForcedTrade':
      return data.syntheticAmount
    case 'Withdraw':
      return undefined
    default:
      assertUnreachable(data)
  }
}

export function extractSentTxAsset(
  data: SentTransactionRecord['data'],
  collateralAsset?: CollateralAsset
): Asset | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
    case 'Withdraw':
      return collateralAsset ? { hashOrId: collateralAsset.assetId } : undefined
    case 'ForcedTrade':
      return { hashOrId: data.syntheticAssetId }
    default:
      assertUnreachable(data)
  }
}
export function sentTransactionToEntry(
  sentTransaction: SentTransactionRecord,
  collateralAsset?: CollateralAsset
): TransactionEntry {
  if (sentTransaction.mined !== undefined && !sentTransaction.mined.reverted) {
    throw new Error(
      'Sent non-reverted transactions will be in userTransactions'
    )
  }
  return {
    timestamp: sentTransaction.sentTimestamp,
    hash: sentTransaction.transactionHash,
    asset: extractSentTxAsset(sentTransaction.data, collateralAsset),
    amount: extractSentTxAmount(sentTransaction.data),
    status: sentTransaction.mined?.reverted ? 'REVERTED' : 'SENT',
    type: extractSentTxEntryType(sentTransaction.data),
  }
}
