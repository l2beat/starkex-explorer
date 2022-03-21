import { AssetId } from '@explorer/types'

export interface PositionAtUpdateProps {
  readonly stateUpdateId: number
  readonly positionId: bigint
  readonly lastUpdateTimestamp: number
  readonly previousPublicKey?: string
  readonly publicKey: string
  readonly assetChanges: ReadonlyArray<{
    readonly assetId: AssetId
    readonly previousBalance: bigint
    readonly currentBalance: bigint
    readonly balanceDiff: bigint
  }>
}
