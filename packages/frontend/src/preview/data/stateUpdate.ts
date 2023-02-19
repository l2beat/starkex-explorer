import { Hash256, StarkKey } from '@explorer/types'

import {
  StateUpdateBalanceChangeEntry,
  StateUpdateTransactionEntry,
} from '../../view'
import { Bucket } from './bucket'
import { amountBucket, assetBucket, changeBucket } from './buckets'
import { randomId } from './utils'

export function randomStateUpdateBalanceChangeEntry(): StateUpdateBalanceChangeEntry {
  return {
    starkKey: StarkKey.fake(),
    asset: assetBucket.pick(),
    balance: amountBucket.pick(),
    change: changeBucket.pick(),
    vaultOrPositionId: randomId(),
  }
}

const transactionTypeBucket = new Bucket(['WITHDRAW', 'BUY', 'SELL'] as const)
export function randomStateUpdateTransactionEntry(): StateUpdateTransactionEntry {
  return {
    hash: Hash256.fake(),
    asset: assetBucket.pick(),
    amount: amountBucket.pick(),
    type: transactionTypeBucket.pick(),
  }
}
