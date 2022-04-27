import {
  EthereumAddress,
  Hash256,
  PedersenHash,
  Timestamp,
} from '@explorer/types'

export interface StateUpdateDetailsProps {
  readonly account: EthereumAddress | undefined
  readonly id: number
  readonly hash: Hash256
  readonly rootHash: PedersenHash
  readonly blockNumber: number
  readonly timestamp: Timestamp
  readonly positions: readonly StateUpdatePosition[]
}

export interface StateUpdatePosition {
  readonly publicKey: string
  readonly positionId: bigint
  readonly totalUSDCents: bigint
  readonly previousTotalUSDCents?: bigint
  readonly assetsUpdated?: number
}
