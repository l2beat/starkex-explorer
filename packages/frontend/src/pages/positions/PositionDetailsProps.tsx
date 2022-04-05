import { AssetId, Timestamp } from '@explorer/types'

export interface PositionDetailsProps {
  readonly positionId: bigint
  readonly publicKey: string
  readonly ethAddress?: string
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly assets: ReadonlyArray<{
    readonly assetId: AssetId
    readonly balance: bigint
    readonly totalUSDCents: bigint
    readonly price?: bigint
  }>
  readonly history: ReadonlyArray<{
    readonly stateUpdateId: number
    readonly totalUSDCents: bigint
    readonly assetsUpdated: number
  }>
}
