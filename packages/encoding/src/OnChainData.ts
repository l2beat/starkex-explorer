export interface OnChainData {
  funding: FundingEntry[]
  positions: PositionUpdate[]
}

export interface FundingEntry {
  indices: FundingIndex[]
  timestamp: bigint
}

export interface FundingIndex {
  assetId: string
  value: bigint
}

export interface PositionUpdate {
  positionId: bigint
  publicKey: string
  collateralBalance: bigint
  fundingTimestamp: bigint
  balances: AssetBalance[]
}

export interface AssetBalance {
  assetId: string
  balance: bigint
}
