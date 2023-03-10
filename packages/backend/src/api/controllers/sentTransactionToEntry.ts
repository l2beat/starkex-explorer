import { TransactionEntry } from '@explorer/frontend'
import { Asset } from '@explorer/frontend/src/utils/assets'
import { assertUnreachable, AssetDetails } from '@explorer/shared'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { SentTransactionRecord } from '../../peripherals/database/transactions/SentTransactionRepository'

export function extractSentTxEntryType(
  data: SentTransactionRecord['data']
): TransactionEntry['type'] {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return 'FORCED_WITHDRAW'
    case 'ForcedTrade':
      return data.isABuyingSynthetic ? 'FORCED_BUY' : 'FORCED_SELL'
    case 'Withdraw':
    case 'WithdrawWithTokenId':
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
    case 'WithdrawWithTokenId':
      return undefined
    default:
      assertUnreachable(data)
  }
}

export function extractSentTxAsset(
  data: SentTransactionRecord['data'],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: Record<string, AssetDetails>
): Asset | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return collateralAsset ? { hashOrId: collateralAsset.assetId } : undefined
    case 'ForcedTrade':
      return { hashOrId: data.syntheticAssetId }
    case 'Withdraw':
      return {
        //assetId = assetType, ref: https://docs.starkware.co/starkex/perpetual/shared/starkex-specific-concepts.html#on_chain_starkex_contracts
        hashOrId: data.assetType,
        details: assetDetailsMap?.[data.assetType.toString()],
      }
    case 'WithdrawWithTokenId':
      throw new Error('NIY')
    default:
      assertUnreachable(data)
  }
}

export function sentTransactionToEntry(
  sentTransaction: SentTransactionRecord,
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: Record<string, AssetDetails>
): TransactionEntry {
  if (sentTransaction.mined !== undefined && !sentTransaction.mined.reverted) {
    throw new Error(
      'Sent non-reverted transactions will be in userTransactions'
    )
  }
  return {
    timestamp: sentTransaction.sentTimestamp,
    hash: sentTransaction.transactionHash,
    asset: extractSentTxAsset(
      sentTransaction.data,
      collateralAsset,
      assetDetailsMap
    ),
    amount: extractSentTxAmount(sentTransaction.data),
    status: sentTransaction.mined?.reverted ? 'REVERTED' : 'SENT',
    type: extractSentTxEntryType(sentTransaction.data),
  }
}
