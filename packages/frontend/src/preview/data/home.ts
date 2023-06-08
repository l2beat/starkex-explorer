import { Hash256 } from '@explorer/types'

import { HomeStateUpdateEntry, OfferEntry, TransactionEntry } from '../../view'
import { L2TransactionEntry } from '../../view/components/tables/L2TransactionsTable'
import { Bucket } from './Bucket'
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

const l2TransactionTypeBucket = new Bucket([
  'Deposit',
  'WithdrawToAddress',
  'ForcedWithdrawal',
  'Trade',
  'ForcedTrade',
  'Transfer',
  'ConditionalTransfer',
  'Liquidate',
  'Deleverage',
  'FundingTick',
  'OraclePricesTick',
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

export function randomHomeL2TransactionEntry(): L2TransactionEntry {
  const stateUpdateId = randomInt(0, 100) > 20 ? randomInt(0, 10000) : undefined

  return {
    transactionId: randomInt(0, 10000),
    stateUpdateId,
    type: l2TransactionTypeBucket.pick(),
    status: stateUpdateId ? 'INCLUDED' : 'PENDING',
  }
}

const offerTypeBucket = new Bucket<'BUY' | 'SELL'>()
offerTypeBucket.add('BUY', 3)
offerTypeBucket.add('SELL', 3)

export function randomHomeOfferEntry(): OfferEntry {
  return {
    timestamp: randomTimestamp(),
    id: randomId(),
    syntheticAsset: assetBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    collateralAmount: amountBucket.pick(),
    status: 'CREATED',
    type: offerTypeBucket.pick(),
  }
}
