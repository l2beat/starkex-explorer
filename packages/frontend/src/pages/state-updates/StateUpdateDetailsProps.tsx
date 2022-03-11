import { PedersenHash } from '@explorer/types'

export interface StateUpdateDetailsProps {
  readonly hash: PedersenHash
  readonly timestamp: number
  readonly id: number
  positions: ReadonlyArray<{
    readonly publicKey: string
    readonly positionId: bigint
    readonly totalUSDCents: bigint
  }>
}
