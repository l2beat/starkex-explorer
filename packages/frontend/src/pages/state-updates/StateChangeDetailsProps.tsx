import { PedersenHash } from '@explorer/types'

export interface StateChangeDetailsProps {
  readonly hash: PedersenHash
  readonly timestamp: number
  readonly id: number
  positions: ReadonlyArray<{
    readonly publicKey: string
    readonly positionId: bigint
    readonly collateralBalance: bigint
    readonly balances: ReadonlyArray<{
      readonly assetId: string
      readonly balance: bigint
    }>
  }>
}
