import {
  EthereumAddress,
  Hash256,
  PedersenHash,
  Timestamp,
} from '@explorer/types'

import { ForcedTransactionEntry } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface StateUpdateDetailsProps {
  readonly account: EthereumAddress | undefined
  readonly id: number
  readonly hash: Hash256
  readonly rootHash: PedersenHash
  readonly blockNumber: number
  readonly timestamp: Timestamp
  readonly positions: readonly PositionUpdateEntry[]
  readonly transactions: readonly ForcedTransactionEntry[]
}

export interface PositionUpdateEntry {
  readonly publicKey: string
  readonly positionId: bigint
  readonly totalUSDCents: bigint
  readonly previousTotalUSDCents?: bigint
  readonly assetsUpdated?: number
}
