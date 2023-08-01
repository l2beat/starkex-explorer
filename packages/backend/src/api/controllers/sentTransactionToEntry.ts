import { TransactionEntry } from '@explorer/frontend'
import { Asset } from '@explorer/frontend/src/utils/assets'
import { assertUnreachable, CollateralAsset } from '@explorer/shared'

import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { TransactionHistory } from '../../core/TransactionHistory'
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
    case 'EscapeVerified':
      return 'INITIATE_ESCAPE'
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
    case 'EscapeVerified':
      return undefined
    default:
      assertUnreachable(data)
  }
}

export function extractSentTxAsset(
  data: SentTransactionRecord['data'],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: AssetDetailsMap
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
        details: assetDetailsMap?.getByAssetHash(data.assetType),
      }
    case 'WithdrawWithTokenId': {
      const assetDetails = assetDetailsMap?.getByAssetTypeHashAndTokenId(
        data.assetType,
        data.tokenId
      )
      if (!assetDetails) {
        return undefined
      }
      return {
        hashOrId: assetDetails.assetHash,
        details: assetDetails,
      }
    }
    case 'EscapeVerified': {
      return collateralAsset ? { hashOrId: collateralAsset.assetId } : undefined
    }
    default:
      assertUnreachable(data)
  }
}

export function sentTransactionToEntry(
  sentTransaction: SentTransactionRecord,
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: AssetDetailsMap
): TransactionEntry {
  if (sentTransaction.mined !== undefined && !sentTransaction.mined.reverted) {
    throw new Error(
      'Sent non-reverted transactions will be in userTransactions'
    )
  }
  const transactionHistory = new TransactionHistory({ sentTransaction })
  return {
    timestamp: sentTransaction.sentTimestamp,
    hash: sentTransaction.transactionHash,
    asset: extractSentTxAsset(
      sentTransaction.data,
      collateralAsset,
      assetDetailsMap
    ),
    amount: extractSentTxAmount(sentTransaction.data),
    status: transactionHistory.getLatestForcedTransactionStatus(),
    type: extractSentTxEntryType(sentTransaction.data),
  }
}
