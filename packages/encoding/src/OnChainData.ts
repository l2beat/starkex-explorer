import { AssetId, StarkKey, Timestamp } from '@explorer/types'

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/program_output.cairo#L34-L49
// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/data_availability.cairo#L34-L64
export interface OnChainData {
  configurationHash: string
  assetConfigHashes: AssetConfigHash[]
  oldState: State
  newState: State
  minimumExpirationTimestamp: bigint
  modifications: Modification[]
  forcedActions: ForcedAction[]
  conditions: string[]
  funding: FundingEntry[]
  positions: PositionUpdate[]
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/definitions/general_config_hash.cairo#L9-L13
export interface AssetConfigHash {
  assetId: AssetId
  hash: string
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/program_output.cairo#L11-L19
export interface Modification {
  publicKey: StarkKey
  positionId: bigint
  difference: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L4-L15
export type ForcedAction = ForcedWithdrawal | ForcedTrade

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L17-L22
export interface ForcedWithdrawal {
  type: 'withdrawal'
  publicKey: StarkKey
  positionId: bigint
  amount: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L41-L52
export interface ForcedTrade {
  type: 'trade'
  publicKeyA: StarkKey
  publicKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  isABuyingSynthetic: boolean
  nonce: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/definitions/objects.cairo#L5-L9
export interface FundingIndex {
  assetId: AssetId
  value: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/state/state.cairo#L84-L93
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

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/definitions/objects.cairo#L35-L41
export interface OraclePrice {
  assetId: AssetId
  price: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/definitions/objects.cairo#L17-L22
export interface FundingEntry {
  indices: FundingIndex[]
  timestamp: Timestamp
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/position/serialize_change.cairo
export interface PositionUpdate {
  positionId: bigint
  publicKey: StarkKey
  collateralBalance: bigint
  fundingTimestamp: Timestamp
  balances: AssetBalance[]
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/position/serialize_change.cairo#L8-L18
export interface AssetBalance {
  assetId: AssetId
  balance: bigint
}
