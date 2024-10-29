import { AssetId, Hash256 } from '@explorer/types'

import {
  OfferEntry,
  TransactionEntry,
  UserAssetEntry,
  UserBalanceChangeEntry,
} from '../../view'
import {
  EscapableAssetEntry,
  WithdrawableAssetEntry,
} from '../../view/pages/user/components/UserQuickActionsTable'
import { Bucket } from './Bucket'
import { amountBucket, assetBucket, changeBucket } from './buckets'
import { randomId, randomTimestamp } from './utils'

export function randomUserBalanceChangeEntry(): UserBalanceChangeEntry {
  return {
    timestamp: randomTimestamp(),
    asset: assetBucket.pick(),
    balance: amountBucket.pick(),
    change: changeBucket.pick(),
    stateUpdateId: randomId(),
    vaultOrPositionId: randomId(),
  }
}

const transactionStatusBucket = new Bucket([
  'SENT',
  'MINED',
  'INCLUDED',
  'REVERTED',
] as const)
const transactionTypeBucket = new Bucket([
  'FORCED_WITHDRAW',
  'FORCED_BUY',
  'FORCED_SELL',
  'WITHDRAW',
] as const)

function randomTransactionTypeAndStatus(): Pick<
  TransactionEntry,
  'type' | 'status'
> {
  const type = transactionTypeBucket.pick()

  if (type === 'WITHDRAW') {
    return {
      status: transactionStatusBucket.pickExcept('INCLUDED'),
      type,
    }
  }

  return {
    status: transactionStatusBucket.pick(),
    type,
  }
}

export function randomUserTransactionEntry(): TransactionEntry {
  return {
    timestamp: randomTimestamp(),
    hash: Hash256.fake(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    ...randomTransactionTypeAndStatus(),
  }
}

const actionBucket = new Bucket(['WITHDRAW', 'CLOSE'] as const)
export function randomUserAssetEntry(
  action?:
    | 'WITHDRAW'
    | 'CLOSE'
    | 'NO_ACTION'
    | 'ESCAPE'
    | 'USE_COLLATERAL_ESCAPE',
  asset?: { hashOrId: AssetId }
): UserAssetEntry {
  return {
    asset: asset ?? assetBucket.pick(),
    balance: amountBucket.pick(),
    value: amountBucket.pick(),
    fundingPayment: amountBucket.pick(),
    action: action ?? actionBucket.pick(),
    vaultOrPositionId: randomId(),
  }
}

const offerStatusBucket = new Bucket([
  'CREATED',
  'ACCEPTED',
  'SENT',
  'CANCELLED',
  'EXPIRED',
] as const)
const offerTypeBucket = new Bucket(['BUY', 'SELL'] as const)
const roleBucket = new Bucket(['MAKER', 'TAKER'] as const)

export function randomUserOfferEntry(withRole?: boolean): OfferEntry {
  return {
    timestamp: randomTimestamp(),
    id: randomId(),
    syntheticAsset: assetBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    collateralAmount: amountBucket.pick(),
    status: offerStatusBucket.pick(),
    role: withRole ? roleBucket.pick() : undefined,
    type: offerTypeBucket.pick(),
  }
}

export function randomWithdrawableAssetEntry(): WithdrawableAssetEntry {
  return {
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
  }
}

export function randomEscapableEntry(): EscapableAssetEntry {
  return {
    asset: { hashOrId: AssetId('USDC-6') },
    positionOrVaultId: 12345n,
    amount: amountBucket.pick(),
  }
}
