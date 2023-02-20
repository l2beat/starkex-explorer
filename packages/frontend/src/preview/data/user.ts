import { Hash256 } from '@explorer/types'

import {
  UserAssetEntry,
  UserBalanceChangeEntry,
  UserOfferEntry,
  UserTransactionEntry,
} from '../../view'
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
  'SENT (1/3)',
  'MINED (2/3)',
  'INCLUDED (3/3)',
  'SENT (1/2)',
  'MINED (2/2)',
  'REVERTED',
] as const)
const transactionTypeBucket = new Bucket([
  'Forced withdraw',
  'Forced buy',
  'Forced sell',
  'Withdraw',
] as const)

export function randomUserTransactionEntry(): UserTransactionEntry {
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

export function randomUserOfferEntry(): UserOfferEntry {
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
