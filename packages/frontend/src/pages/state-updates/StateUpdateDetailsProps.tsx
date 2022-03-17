import { PedersenHash } from '@explorer/types'

export interface StateUpdateDetailsProps {
  readonly id: number
  readonly hash: PedersenHash
  readonly rootHash: PedersenHash
  readonly blockNumber: bigint
  readonly timestamp: number
  positions: ReadonlyArray<{
    readonly publicKey: string
    readonly positionId: bigint
    readonly totalUSDCents: bigint
  }>
}
