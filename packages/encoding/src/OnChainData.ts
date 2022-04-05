import { AssetId, Timestamp } from '@explorer/types'

export interface OnChainData {
  configurationHash: string
  assetDataHashes: AssetDataHash[]
  oldState: State
  newState: State
  funding: FundingEntry[]
  positions: PositionUpdate[]
}

export interface AssetDataHash {
  assetId: AssetId
  hash: string
}

export interface FundingIndex {
  assetId: AssetId
  value: bigint
}

export interface State {
  positionRoot: string
  positionHeight: number
  orderRoot: string
  orderHeight: number
  indices: FundingIndex[]
  timestamp: Timestamp
  oraclePrices: OraclePrice[]
  systemTime: Timestamp
}

export interface OraclePrice {
  assetId: AssetId
  price: bigint
}

export interface FundingEntry {
  indices: FundingIndex[]
  timestamp: Timestamp
}

export interface PositionUpdate {
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  fundingTimestamp: Timestamp
  balances: AssetBalance[]
}

export interface AssetBalance {
  assetId: AssetId
  balance: bigint
}
