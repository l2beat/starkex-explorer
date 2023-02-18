import { UserDetails } from '@explorer/shared'
import { Hash256 } from '@explorer/types'

import {
  HomeForcedTransactionEntry,
  HomeOfferEntry,
  HomePageProps,
  HomeStateUpdateEntry,
} from '../../view'
import { Bucket } from './bucket'
import { amountBucket, assetBucket } from './buckets'
import { randomId, randomInt, randomTimestamp, repeat } from './utils'

export function randomHomeProps(user: UserDetails | undefined): HomePageProps {
  return {
    user,
    tutorials: [],
    stateUpdates: repeat(6, randomHomeStateUpdateEntry),
    stateUpdateCount: 5123,
    forcedTransactions: repeat(6, randomHomeForcedTransactionEntry),
    forcedTransactionCount: 68,
    offers: repeat(6, randomHomeOfferEntry),
    offerCount: 7,
  }
}

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

const transactionTypeBucket = new Bucket<'BUY' | 'SELL' | 'WITHDRAWAL'>()
transactionTypeBucket.add('BUY', 2)
transactionTypeBucket.add('SELL', 2)
transactionTypeBucket.add('WITHDRAWAL', 4)

export function randomHomeForcedTransactionEntry(): HomeForcedTransactionEntry {
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
