import { Hash256, PedersenHash, StarkKey } from '@explorer/types'

import {
  StateUpdateBalanceChangeEntry,
  StateUpdatePriceEntry,
  TransactionEntry,
} from '../../view'
import { MerkleProofPath } from '../../view/pages/state-update/StateUpdateMerkleProofPage'
import { Bucket } from './bucket'
import { amountBucket, assetBucket, changeBucket } from './buckets'
import { randomId, randomTimestamp } from './utils'

export function randomStateUpdatePriceEntry(): StateUpdatePriceEntry {
  return {
    asset: assetBucket.pick(),
    price: amountBucket.pick(),
    change: changeBucket.pick(),
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

export function randomStateUpdateMerkleProofPath(): MerkleProofPath {
  return {
    left: PedersenHash.fake(),
    right: PedersenHash.fake(),
  }
}
