import { PedersenHash } from '@explorer/crypto'

export interface StateChangeDetailsProps {
  readonly hash: PedersenHash
  readonly timestamp: number
  positions: ReadonlyArray<{
    readonly publicKey: string
    readonly positionId: bigint
    readonly collateralBalance: bigint
    readonly balances: ReadonlyArray<{
      readonly assetId: String
      readonly balance: bigint
    }>
  }>
}
