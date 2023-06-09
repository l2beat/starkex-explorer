import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

export type L2TransactionData =
  | DepositL2TransactionData
  | WithdrawToAddressL2TransactionData
  | ForcedWithdrawalL2TransactionData
  | TradeL2TransactionData
  | ForcedTradeL2TransactionData
  | TransferL2TransactionData
  | ConditionalTransferL2TransactionData
  | LiquidateL2TransactionData
  | DeleverageL2TransactionData
  | FundingTickL2TransactionData
  | OraclePricesTickL2TransactionData
  | MultiL2TransactionData

type OrderType = 'LimitOrderWithFees'

export interface L2TransactionSignature {
  s: Hash256
  r: Hash256
}

export interface L2TransactionPartyOrder {
  nonce: bigint
  isBuyingSynthetic: boolean
  expirationTimestamp: Timestamp
  signature: L2TransactionSignature
  syntheticAssetId: AssetId
  orderType: OrderType
  collateralAssetId: AssetHash
  positionId: bigint
  syntheticAmount: bigint
  collateralAmount: bigint
  feeAmount: bigint
  starkKey: StarkKey
}

export interface DepositL2TransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  type: 'Deposit'
}

export interface WithdrawToAddressL2TransactionData {
  positionId: bigint
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  amount: bigint
  nonce: bigint
  expirationTimestamp: Timestamp
  signature: L2TransactionSignature
  type: 'WithdrawToAddress'
}

export interface ForcedWithdrawalL2TransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  isValid: boolean
  type: 'ForcedWithdrawal'
}

export interface TradeL2TransactionData {
  actualBFee: bigint
  actualAFee: bigint
  actualSynthetic: bigint
  actualCollateral: bigint
  partyAOrder: L2TransactionPartyOrder
  partyBOrder: L2TransactionPartyOrder
  type: 'Trade'
}

export interface ForcedTradeL2TransactionData {
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAssetId: AssetHash
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  isABuyingSynthetic: boolean
  nonce: bigint
  isValid: boolean
  type: 'ForcedTrade'
}

export interface TransferL2TransactionData {
  amount: bigint
  nonce: bigint
  senderStarkKey: StarkKey
  receiverStarkKey: StarkKey
  senderPositionId: bigint
  receiverPositionId: bigint
  assetId: AssetHash
  expirationTimestamp: Timestamp
  signature: L2TransactionSignature
  type: 'Transfer'
}

export interface ConditionalTransferL2TransactionData {
  amount: bigint
  nonce: bigint
  senderStarkKey: StarkKey
  receiverStarkKey: StarkKey
  senderPositionId: bigint
  receiverPositionId: bigint
  assetId: AssetHash
  expirationTimestamp: Timestamp
  factRegistryAddress: EthereumAddress
  fact: Hash256
  signature: L2TransactionSignature
  type: 'ConditionalTransfer'
}

export interface L2TransactionLiquidateOrder {
  orderType: OrderType
  nonce: bigint
  starkKey: StarkKey
  syntheticAssetId: AssetId
  syntheticAmount: bigint
  collateralAssetId: AssetHash
  collateralAmount: bigint
  feeAmount: bigint
  positionId: bigint
  expirationTimestamp: Timestamp
  isBuyingSynthetic: boolean
  signature: L2TransactionSignature
}

export interface LiquidateL2TransactionData {
  liquidatorOrder: L2TransactionLiquidateOrder
  liquidatedPositionId: bigint
  actualCollateral: bigint
  actualSynthetic: bigint
  actualLiquidatorFee: bigint
  type: 'Liquidate'
}

export interface DeleverageL2TransactionData {
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  deleveragedPositionId: bigint
  isDeleveragerBuyingSynthetic: boolean
  deleveragerPositionId: bigint
  type: 'Deleverage'
}

interface FundingIndex {
  syntheticAssetId: AssetId
  quantizedFundingIndex: number
}

interface FundingIndicesState {
  indices: FundingIndex[]
  timestamp: Timestamp
}
export interface FundingTickL2TransactionData {
  globalFundingIndices: FundingIndicesState
  type: 'FundingTick'
}

export interface L2TransactionSignedOraclePrice {
  signerPublicKey: Hash256
  externalAssetId: AssetHash
  timestampedSignature: {
    signature: L2TransactionSignature
    timestamp: Timestamp
  }
  price: bigint
}

export interface L2TransactionAssetOraclePrice {
  syntheticAssetId: AssetId
  signedPrices: L2TransactionSignedOraclePrice[]
  price: bigint
}

export interface OraclePricesTickL2TransactionData {
  timestamp: Timestamp
  oraclePrices: L2TransactionAssetOraclePrice[]
  type: 'OraclePricesTick'
}

export interface MultiL2TransactionData {
  transactions: Exclude<L2TransactionData, MultiL2TransactionData>[]
  type: 'MultiTransaction'
}
