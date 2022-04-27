import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'

export interface PositionAtUpdateProps {
  readonly account: EthereumAddress | undefined
  readonly stateUpdateId: number
  readonly positionId: bigint
  readonly lastUpdateTimestamp: Timestamp
  readonly previousPublicKey?: string
  readonly publicKey: string
  readonly assetChanges: readonly AssetChange[]
}

export interface AssetChange {
  readonly assetId: AssetId
  readonly previousBalance: bigint
  readonly currentBalance: bigint
  readonly balanceDiff: bigint
}
