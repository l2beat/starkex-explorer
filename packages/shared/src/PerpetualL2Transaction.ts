import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

export type PerpetualL2TransactionData =
  | PerpetualL2DepositTransactionData
  | PerpetualL2WithdrawToAddressTransactionData
  | PerpetualL2ForcedWithdrawalTransactionData
  | PerpetualL2TradeTransactionData
  | PerpetualL2ForcedTradeTransactionData
  | PerpetualL2TransferTransactionData
  | PerpetualL2ConditionalTransferTransactionData
  | PerpetualL2LiquidateTransactionData
  | PerpetualL2DeleverageTransactionData
  | PerpetualL2FundingTickTransactionData
  | PerpetualL2OraclePricesTickTransactionData
  | PerpetualL2MultiTransactionData

type OrderType = 'LimitOrderWithFees'

export interface PerpetualL2TransactionSignature {
  s: Hash256
  r: Hash256
}

export interface PerpetualL2TransactionPartyOrder {
  nonce: bigint
  isBuyingSynthetic: boolean
  expirationTimestamp: Timestamp
  signature: PerpetualL2TransactionSignature
  syntheticAssetId: AssetId
  orderType: OrderType
  collateralAssetId: AssetHash
  positionId: bigint
  syntheticAmount: bigint
  collateralAmount: bigint
  feeAmount: bigint
  starkKey: StarkKey
}

export interface PerpetualL2DepositTransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  type: 'Deposit'
}

export interface PerpetualL2WithdrawToAddressTransactionData {
  positionId: bigint
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  amount: bigint
  nonce: bigint
  expirationTimestamp: Timestamp
  signature: PerpetualL2TransactionSignature
  type: 'WithdrawToAddress'
}

export interface PerpetualL2ForcedWithdrawalTransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  isValid: boolean
  type: 'ForcedWithdrawal'
}

export interface PerpetualL2TradeTransactionData {
  actualBFee: bigint
  actualAFee: bigint
  actualSynthetic: bigint
  actualCollateral: bigint
  partyAOrder: PerpetualL2TransactionPartyOrder
  partyBOrder: PerpetualL2TransactionPartyOrder
  type: 'Trade'
}

export interface PerpetualL2ForcedTradeTransactionData {
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

export interface PerpetualL2TransferTransactionData {
  amount: bigint
  nonce: bigint
  senderStarkKey: StarkKey
  receiverStarkKey: StarkKey
  senderPositionId: bigint
  receiverPositionId: bigint
  assetId: AssetHash
  expirationTimestamp: Timestamp
  signature: PerpetualL2TransactionSignature
  type: 'Transfer'
}

export interface PerpetualL2ConditionalTransferTransactionData {
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
  signature: PerpetualL2TransactionSignature
  type: 'ConditionalTransfer'
}

export interface PerpetualL2TransactionLiquidateOrder {
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
  signature: PerpetualL2TransactionSignature
}

export interface PerpetualL2LiquidateTransactionData {
  liquidatorOrder: PerpetualL2TransactionLiquidateOrder
  liquidatedPositionId: bigint
  actualCollateral: bigint
  actualSynthetic: bigint
  actualLiquidatorFee: bigint
  type: 'Liquidate'
}

export interface PerpetualL2DeleverageTransactionData {
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  deleveragedPositionId: bigint
  isDeleveragerBuyingSynthetic: boolean
  deleveragerPositionId: bigint
  type: 'Deleverage'
}

export interface PerpetualFundingIndex {
  syntheticAssetId: AssetId
  quantizedFundingIndex: number
}

interface FundingIndicesState {
  indices: PerpetualFundingIndex[]
  timestamp: Timestamp
}
export interface PerpetualL2FundingTickTransactionData {
  globalFundingIndices: FundingIndicesState
  type: 'FundingTick'
}

export interface PerpetualL2TransactionSignedOraclePrice {
  signerPublicKey: Hash256
  externalAssetId: AssetHash
  timestampedSignature: {
    signature: PerpetualL2TransactionSignature
    timestamp: Timestamp
  }
  price: bigint
}

export interface PerpetualL2TransactionAssetOraclePrice {
  syntheticAssetId: AssetId
  signedPrices: PerpetualL2TransactionSignedOraclePrice[]
  price: bigint
}

export interface PerpetualL2OraclePricesTickTransactionData {
  timestamp: Timestamp
  oraclePrices: PerpetualL2TransactionAssetOraclePrice[]
  type: 'OraclePricesTick'
}

export interface PerpetualL2MultiTransactionData {
  transactions: Exclude<
    PerpetualL2TransactionData,
    PerpetualL2MultiTransactionData
  >[]
  type: 'MultiTransaction'
}
