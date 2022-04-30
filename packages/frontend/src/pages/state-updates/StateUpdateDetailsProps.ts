import {
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { ForcedTransaction } from '../forced-transactions/ForcedTransactionsIndexProps'

export interface StateUpdateDetailsProps {
  readonly account: EthereumAddress | undefined
  readonly id: number
  readonly hash: Hash256
  readonly rootHash: PedersenHash
  readonly blockNumber: number
  readonly timestamp: Timestamp
  readonly positions: readonly StateUpdatePosition[]
  readonly transactions: readonly Omit<ForcedTransaction, 'status'>[]
}

export interface StateUpdatePosition {
  readonly publicKey: StarkKey
  readonly positionId: bigint
  readonly totalUSDCents: bigint
  readonly previousTotalUSDCents?: bigint
  readonly assetsUpdated?: number
}
