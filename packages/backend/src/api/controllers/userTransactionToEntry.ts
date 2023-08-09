import { TransactionEntry } from '@explorer/frontend'
import { Asset } from '@explorer/frontend/src/utils/assets'
import { assertUnreachable, CollateralAsset } from '@explorer/shared'

import { AssetDetailsMap } from '../../core/AssetDetailsMap'
import { TransactionHistory } from '../../core/TransactionHistory'
import { UserTransactionRecord } from '../../peripherals/database/transactions/UserTransactionRepository'

function extractUserTxAmount(
  data: UserTransactionRecord['data']
): bigint | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
    case 'FinalizeEscape':
      return data.quantizedAmount
    case 'ForcedTrade':
      return data.syntheticAmount
    case 'VerifyEscape':
      return data.withdrawalAmount
    case 'Withdraw':
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return data.quantizedAmount
    case 'FullWithdrawal':
    case 'FreezeRequest':
      return undefined
    default:
      assertUnreachable(data)
  }
}

function extractUserTxAsset(
  data: UserTransactionRecord['data'],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: AssetDetailsMap
): Asset | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
    case 'FinalizeEscape':
    case 'VerifyEscape':
      return collateralAsset ? { hashOrId: collateralAsset.assetId } : undefined
    case 'ForcedTrade':
      return { hashOrId: data.syntheticAssetId }
    case 'Withdraw':
      return {
        hashOrId: collateralAsset ? collateralAsset.assetId : data.assetType,
        details: assetDetailsMap?.getByAssetHash(data.assetType),
      }
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return {
        hashOrId: data.assetId,
        details: assetDetailsMap?.getByAssetHash(data.assetId),
      }
    case 'FullWithdrawal':
    case 'FreezeRequest':
      return undefined //TODO: Fix this (FULL WITHDRAWAL)
    default:
      assertUnreachable(data)
  }
}

function extractUserTxEntryType(
  data: UserTransactionRecord['data']
): TransactionEntry['type'] {
  switch (data.type) {
    case 'ForcedTrade':
      return data.isABuyingSynthetic ? 'FORCED_BUY' : 'FORCED_SELL'
    case 'ForcedWithdrawal':
    case 'FullWithdrawal':
      return 'FORCED_WITHDRAW'
    case 'VerifyEscape':
      return 'INITIATE_ESCAPE'
    case 'Withdraw':
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return 'WITHDRAW'
    case 'FinalizeEscape':
      return 'FINALIZE_ESCAPE'
    case 'FreezeRequest':
      return 'FREEZE_REQUEST'
    default:
      assertUnreachable(data)
  }
}

export function userTransactionToEntry(
  userTransaction: UserTransactionRecord,
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: AssetDetailsMap
): TransactionEntry {
  const transactionHistory = new TransactionHistory({ userTransaction })
  return {
    timestamp: userTransaction.timestamp,
    hash: userTransaction.transactionHash,
    asset: extractUserTxAsset(
      userTransaction.data,
      collateralAsset,
      assetDetailsMap
    ),
    amount: extractUserTxAmount(userTransaction.data),
    status: transactionHistory.getLatestForcedTransactionStatus(),
    type: extractUserTxEntryType(userTransaction.data),
  }
}
