import { Hash256 } from '@explorer/types'

import {
  OfferEntry,
  TransactionEntry,
  UserAssetEntry,
  UserBalanceChangeEntry,
} from '../../view'
import { L2TransactionEntry } from '../../view/components/tables/L2TransactionsTable'
import { WithdrawableAssetEntry } from '../../view/pages/user/components/UserQuickActionsTable'
import { Bucket } from './Bucket'
import { amountBucket, assetBucket, changeBucket } from './buckets'
import { randomId, randomInt, randomTimestamp } from './utils'

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

const userL2TypeBucket = new Bucket([
  'Deposit',
  'WithdrawToAddress',
  'ForcedWithdrawal',
  'Trade',
  'ForcedTrade',
  'Transfer',
  'ConditionalTransfer',
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
    syntheticAsset: assetBucket.pick(),
    syntheticAmount: amountBucket.pick(),
    collateralAmount: amountBucket.pick(),
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

export function randomUserL2TransactionEntry(): L2TransactionEntry {
  const stateUpdateId = randomInt(0, 100) > 80 ? randomInt(0, 10000) : undefined
  return {
    transactionId: randomInt(0, 10000),
    stateUpdateId: stateUpdateId,
    type: userL2TypeBucket.pick(),
    status: stateUpdateId ? 'INCLUDED' : 'PENDING',
  }
}
