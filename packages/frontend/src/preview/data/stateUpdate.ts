import { StarkKey } from '@explorer/types'

import { StateUpdateBalanceChangeEntry } from '../../view/pages/state-update/components/StateUpdateBalanceChangesTable'
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
