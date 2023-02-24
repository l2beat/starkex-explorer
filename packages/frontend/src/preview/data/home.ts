import { Hash256 } from '@explorer/types'

import {
  HomeOfferEntry,
  HomeStateUpdateEntry,
  TransactionEntry,
} from '../../view'
import { Bucket } from './bucket'
import { amountBucket, assetBucket } from './buckets'
import { randomId, randomInt, randomTimestamp } from './utils'

export function randomHomeStateUpdateEntry(): HomeStateUpdateEntry {
  return {
    timestamp: randomTimestamp(),
    id: randomId(),
    hash: Hash256.fake(),
    updateCount: randomInt(20, 1256),
    forcedTransactionCount: randomInt(0, 10),
  }
}

const transactionStatusBucket = new Bucket<'MINED' | 'INCLUDED'>()
transactionStatusBucket.add('MINED', 2)
transactionStatusBucket.add('INCLUDED', 4)

const transactionTypeBucket = new Bucket([
  'FORCED_BUY',
  'FORCED_SELL',
  'FORCED_WITHDRAW',
] as const)

export function randomHomeForcedTransactionEntry(): TransactionEntry {
  return {
    timestamp: randomTimestamp(),
    hash: Hash256.fake(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    status: transactionStatusBucket.pick(),
    type: transactionTypeBucket.pick(),
  }
}

const offerTypeBucket = new Bucket<'BUY' | 'SELL'>()
offerTypeBucket.add('BUY', 3)
offerTypeBucket.add('SELL', 3)

export function randomHomeOfferEntry(): HomeOfferEntry {
  return {
    timestamp: randomTimestamp(),
    id: randomId(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    price: amountBucket.pick(),
    totalPrice: amountBucket.pick(),
    type: offerTypeBucket.pick(),
  }
}
