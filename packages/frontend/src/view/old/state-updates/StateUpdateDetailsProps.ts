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
  readonly positionId: bigint
  readonly starkKey: StarkKey
  readonly forcedTransactions: number
  readonly collateralBalance: bigint
  readonly totalUSDCents: bigint
}
