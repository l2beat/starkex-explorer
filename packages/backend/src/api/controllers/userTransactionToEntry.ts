import { TransactionEntry } from '@explorer/frontend'
import { Asset } from '@explorer/frontend/src/utils/assets'
import { AssetDetails } from '@explorer/shared'

import { CollateralAsset } from '../../config/starkex/StarkexConfig'
import { UserTransactionRecord } from '../../peripherals/database/transactions/UserTransactionRepository'
import { assertUnreachable } from '../../utils/assertUnreachable'

function extractUserTxAmount(
  data: UserTransactionRecord['data']
): bigint | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return data.quantizedAmount
    case 'ForcedTrade':
      return data.syntheticAmount
    case 'FullWithdrawal':
      return undefined
    case 'Withdraw':
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return data.quantizedAmount
    default:
      assertUnreachable(data)
  }
}

function extractUserTxAsset(
  data: UserTransactionRecord['data'],
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: Record<string, AssetDetails>
): Asset | undefined {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return collateralAsset ? { hashOrId: collateralAsset.assetId } : undefined
    case 'ForcedTrade':
      return { hashOrId: data.syntheticAssetId }
    case 'FullWithdrawal':
      return undefined
    case 'Withdraw':
      return {
        hashOrId: collateralAsset ? collateralAsset.assetId : data.assetType,
        details: assetDetailsMap?.[data.assetType.toString()],
      }
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return {
        hashOrId: data.assetId,
        details: assetDetailsMap?.[data.assetId.toString()],
      }
    default:
      assertUnreachable(data)
  }
}

function extractUserTxEntryType(
  data: UserTransactionRecord['data']
): TransactionEntry['type'] {
  switch (data.type) {
    case 'ForcedWithdrawal':
      return 'FORCED_WITHDRAW'
    case 'ForcedTrade':
      return data.isABuyingSynthetic ? 'FORCED_BUY' : 'FORCED_SELL'
    case 'FullWithdrawal':
      return 'FORCED_WITHDRAW'
    case 'Withdraw':
    case 'WithdrawWithTokenId':
    case 'MintWithdraw':
      return 'WITHDRAW'
    default:
      assertUnreachable(data)
  }
}

export function userTransactionToEntry(
  userTransaction: UserTransactionRecord,
  collateralAsset?: CollateralAsset,
  assetDetailsMap?: Record<string, AssetDetails>
): TransactionEntry {
  return {
    timestamp: userTransaction.timestamp,
    hash: userTransaction.transactionHash,
    asset: extractUserTxAsset(
      userTransaction.data,
      collateralAsset,
      assetDetailsMap
    ),
    amount: extractUserTxAmount(userTransaction.data),
    status: userTransaction.included !== undefined ? 'INCLUDED' : 'MINED',
    type: extractUserTxEntryType(userTransaction.data),
  }
}
