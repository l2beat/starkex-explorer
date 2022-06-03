import { Hash256, PedersenHash, StarkKey, Timestamp } from '@explorer/types'

import { AccountDetails } from '../common/AccountDetails'
import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface StateUpdateDetailsProps {
  readonly account: AccountDetails | undefined
  readonly id: number
  readonly hash: Hash256
  readonly rootHash: PedersenHash
  readonly blockNumber: number
  readonly timestamp: Timestamp
  readonly positions: readonly PositionUpdateEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
}

export interface PositionUpdateEntry {
  readonly starkKey: StarkKey
  readonly positionId: bigint
  readonly totalUSDCents: bigint
  readonly previousTotalUSDCents?: bigint
  readonly assetsUpdated?: number
}
