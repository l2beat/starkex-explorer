import { AssetId, StarkKey, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface PositionAtUpdateProps {
  readonly account: AccountDetails | undefined
  readonly stateUpdateId: number
  readonly positionId: bigint
  readonly lastUpdateTimestamp: Timestamp
  readonly previousstarkKey?: StarkKey
  readonly starkKey: StarkKey
  readonly assetChanges: readonly AssetChangeEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
}

export interface AssetChangeEntry {
  readonly assetId: AssetId
  readonly previousBalance: bigint
  readonly currentBalance: bigint
  readonly balanceDiff: bigint
}
