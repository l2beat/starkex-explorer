import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  PedersenHash,
  StarkKey,
  Timestamp,
} from '@explorer/types'

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/program_output.cairo#L34-L49
export interface PerpetualCairoOutput {
  configurationHash: Hash256 // we use Hash256 here because we don't know if it is PedersenHash
  assetConfigHashes: AssetConfigHash[]
  oldState: State
  newState: State
  minimumExpirationTimestamp: bigint
  modifications: Modification[]
  forcedActions: PerpetualForcedAction[]
  conditions: PedersenHash[]
  onChainDataHash?: Hash256
  onChainDataSize?: bigint
}

// https://github.com/starkware-libs/starkex-for-spot-trading/blob/607f0b4ce507e1d95cd018d206a2797f6ba4aab4/src/starkware/cairo/dex/main.cairo#L21-L37
export interface SpotCairoOutput {
  configCode: bigint
  initialValidiumVaultRoot: PedersenHash
  finalValidiumVaultRoot: PedersenHash
  initialRollupVaultRoot: PedersenHash
  finalRollupVaultRoot: PedersenHash
  initialOrderRoot: PedersenHash
  finalOrderRoot: PedersenHash
  globalExpirationTimestamp: number
  validiumVaultTreeHeight: number
  rollupVaultTreeHeight: number
  orderTreeHeight: number
  modifications: SpotModification[]
  conditionalTransfers: Hash256[]
  l1VaultUpdates: VaultUpdate[]
  l1OrderMessages: OrderMessage[]
  onChainDataHash: Hash256
  onChainDataSize: bigint
}

export type ForcedAction = PerpetualForcedAction | SpotForcedAction

// https://github.com/starkware-libs/starkex-for-spot-trading/blob/master/src/starkware/cairo/dex/execute_modification.cairo#L13
export type SpotModification = FullWithdrawal | SpotWithdrawal

export interface FullWithdrawal {
  type: 'fullWithdrawal'
  starkKey: StarkKey
  assetHash: AssetHash
  vaultId: bigint
  balanceDifference: bigint
}

export interface SpotWithdrawal {
  type: 'spotWithdrawal'
  starkKey: StarkKey
  assetHash: AssetHash
  vaultId: bigint
  balanceDifference: bigint
}

export type SpotForcedAction = FullWithdrawal

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/data_availability.cairo#L34-L64
export interface OnChainPositionsUpdate {
  funding: FundingEntry[]
  positions: PositionUpdate[]
}

export type OnChainData = PerpetualCairoOutput & OnChainPositionsUpdate

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/definitions/general_config_hash.cairo#L9-L13
export interface AssetConfigHash {
  assetId: AssetId
  hash: PedersenHash
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/program_output.cairo#L11-L19
export interface Modification {
  starkKey: StarkKey
  positionId: bigint
  difference: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L4-L15
export type PerpetualForcedAction = ForcedWithdrawal | ForcedTrade

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L17-L22
export interface ForcedWithdrawal {
  type: 'withdrawal'
  starkKey: StarkKey
  positionId: bigint
  amount: bigint
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/output/forced.cairo#L41-L52
export interface ForcedTrade {
  type: 'trade'
  starkKeyA: StarkKey
  starkKeyB: StarkKey
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
  positionRoot: PedersenHash
  positionHeight: number
  orderRoot: PedersenHash
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
  starkKey: StarkKey
  collateralBalance: bigint
  fundingTimestamp: Timestamp
  balances: AssetBalance[]
}

export interface VaultUpdate {
  address: EthereumAddress
  assetId: bigint
  difference: bigint
}

export interface OrderMessage {
  sender: EthereumAddress
  orderHash: Hash256
}

// https://github.com/starkware-libs/stark-perpetual/blob/0bf87e5c34bd9171482e45ebe037b52933a21689/src/services/perpetual/cairo/position/serialize_change.cairo#L8-L18
export interface AssetBalance {
  assetId: AssetId
  balance: bigint
}
