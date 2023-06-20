import { Hash256, StarkKey } from '@explorer/types'

import {
  PriceEntry,
  StateUpdateBalanceChangeEntry,
  TransactionEntry,
} from '../../view'
import { Bucket } from './Bucket'
import { amountBucket, assetBucket, changeBucket } from './buckets'
import { randomId, randomTimestamp } from './utils'

export function randomStateUpdatePriceEntry(): PriceEntry {
  return {
    asset: assetBucket.pick(),
    priceInCents: amountBucket.pick(),
  }
}

export function randomStateUpdateBalanceChangeEntry(): StateUpdateBalanceChangeEntry {
  return {
    starkKey: StarkKey.fake(),
    asset: assetBucket.pick(),
    balance: amountBucket.pick(),
    change: changeBucket.pick(),
    vaultOrPositionId: randomId(),
  }
}

const transactionTypeBucket = new Bucket([
  'FORCED_WITHDRAW',
  'FORCED_BUY',
  'FORCED_SELL',
] as const)
export function randomStateUpdateTransactionEntry(): TransactionEntry {
  return {
    timestamp: randomTimestamp(),
    hash: Hash256.fake(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    status: 'INCLUDED',
    type: transactionTypeBucket.pick(),
  }
}
