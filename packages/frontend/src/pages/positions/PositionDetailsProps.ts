import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

export interface PositionDetailsProps {
  readonly account: EthereumAddress | undefined
  readonly positionId: bigint
  readonly publicKey: string
  readonly ethAddress?: string
  readonly stateUpdateId: number
  readonly lastUpdateTimestamp: Timestamp
  readonly assets: readonly PositionAsset[]
  readonly history: readonly PositionHistoryEntry[]
}

export interface PositionAsset {
  readonly assetId: AssetId
  readonly balance: bigint
  readonly totalUSDCents: bigint
  readonly price?: bigint
}

export interface PositionHistoryEntry {
  readonly stateUpdateId: number
  readonly totalUSDCents: bigint
  readonly assetsUpdated: number
}
