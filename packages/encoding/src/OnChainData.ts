import { AssetId } from '@explorer/types'

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
  timestamp: bigint
  oraclePrices: OraclePrice[]
  systemTime: bigint
}

export interface OraclePrice {
  assetId: AssetId
  price: bigint
}

export interface FundingEntry {
  indices: FundingIndex[]
  timestamp: bigint
}

export interface PositionUpdate {
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  fundingTimestamp: bigint
  balances: AssetBalance[]
}

export interface AssetBalance {
  assetId: AssetId
  balance: bigint
}
