import { Hash256 } from '@explorer/types'

import {
  OfferEntry,
  TransactionEntry,
  UserAssetEntry,
  UserBalanceChangeEntry,
} from '../../view'
import { WithdrawableAssetEntry } from '../../view/pages/user/components/UserQuickActionsTable'
import { Bucket } from './bucket'
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

export function randomUserTransactionEntry(): TransactionEntry {
  return {
    timestamp: randomTimestamp(),
    hash: Hash256.fake(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    status: transactionStatusBucket.pick(),
    type: transactionTypeBucket.pick(),
  }
}

const actionBucket = new Bucket(['WITHDRAW', 'CLOSE'] as const)
export function randomUserAssetEntry(): UserAssetEntry {
  return {
    asset: assetBucket.pick(),
    balance: amountBucket.pick(),
    value: amountBucket.pick(),
    action: actionBucket.pick(),
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

export function randomUserOfferEntry(): OfferEntry {
  return {
    timestamp: randomTimestamp(),
    id: randomId(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    price: amountBucket.pick(),
    totalPrice: amountBucket.pick(),
    status: offerStatusBucket.pick(),
    type: offerTypeBucket.pick(),
  }
}

export function randomWithdrawableAssetEntry(): WithdrawableAssetEntry {
  return {
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
  }
}
