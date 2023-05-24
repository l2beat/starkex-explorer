import { assertUnreachable } from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { ToJSON } from './transactions/ToJSON'

export type TransactionData =
  | DepositTransactionData
  | WithdrawToAddressTransactionData
  | ForcedWithdrawalTransactionData
  | TradeTransactionData
  | ForcedTradeTransactionData
  | TransferTransactionData
  | ConditionalTransferTransactionData
  | LiquidateTransactionData
  | DeleverageTransactionData
  | FundingTickTransactionData
  | OraclePricesTickTransactionData
  | MultiTransactionData

interface Encoded<T> {
  starkKeyA: StarkKey | null
  starkKeyB: StarkKey | null
  data: ToJSON<T>
}

export type TransactionDataJson = ToJSON<TransactionData>
type OrderType = 'LimitOrderWithFees'

interface Signature {
  s: Hash256
  r: Hash256
}

interface PartyOrder {
  nonce: bigint
  isBuyingSynthetic: boolean
  expirationTimestamp: Timestamp
  signature: Signature
  syntheticAssetId: AssetId
  orderType: OrderType
  collateralAssetId: AssetHash
  positionId: bigint
  syntheticAmount: bigint
  collateralAmount: bigint
  feeAmount: bigint
  starkKey: StarkKey
}

export interface DepositTransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  type: 'Deposit'
}

export interface WithdrawToAddressTransactionData {
  positionId: bigint
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  amount: bigint
  nonce: bigint
  expirationTimestamp: Timestamp
  signature: Signature
  type: 'WithdrawToAddress'
}

export interface ForcedWithdrawalTransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  isValid: boolean
  type: 'ForcedWithdrawal'
}

export interface TradeTransactionData {
  actualBFee: bigint
  actualAFee: bigint
  actualSynthetic: bigint
  actualCollateral: bigint
  partyAOrder: PartyOrder
  partyBOrder: PartyOrder
  type: 'Trade'
}

export interface ForcedTradeTransactionData {
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

export interface TransferTransactionData {
  amount: bigint
  nonce: bigint
  senderStarkKey: StarkKey
  receiverStarkKey: StarkKey
  senderPositionId: bigint
  receiverPositionId: bigint
  assetId: AssetHash
  expirationTimestamp: Timestamp
  signature: Signature
  type: 'Transfer'
}

export interface ConditionalTransferTransactionData {
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
  signature: Signature
  type: 'ConditionalTransfer'
}

interface LiquidateOrder {
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
  signature: Signature
}

export interface LiquidateTransactionData {
  liquidatorOrder: LiquidateOrder
  liquidatedPositionId: bigint
  actualCollateral: bigint
  actualSynthetic: bigint
  actualLiquidatorFee: bigint
  type: 'Liquidate'
}

export interface DeleverageTransactionData {
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
export interface FundingTickTransactionData {
  globalFundingIndices: FundingIndicesState
  type: 'FundingTick'
}

interface SignedOraclePrice {
  signerPublicKey: Hash256
  externalAssetId: AssetHash
  timestampedSignature: {
    signature: Signature
    timestamp: Timestamp
  }
  price: bigint
}

interface AssetOraclePrice {
  syntheticAssetId: AssetId
  signedPrices: SignedOraclePrice[]
  price: bigint
}

export interface OraclePricesTickTransactionData {
  timestamp: Timestamp
  oraclePrices: AssetOraclePrice[]
  type: 'OraclePricesTick'
}

export interface MultiTransactionData {
  transactions: Exclude<TransactionData, MultiTransactionData>[]
  type: 'MultiTransaction'
}

export function encodeTransactionData(
  values: TransactionData
): Encoded<TransactionData> {
  if (values.type === 'MultiTransaction') {
    return encodeMultiTransaction(values)
  }

  return encodeTransaction(values)
}

export function decodeTransactionData(
  values: ToJSON<TransactionData>
): TransactionData {
  if (values.type === 'MultiTransaction') {
    return decodeMultiTransaction(values)
  }

  return decodeTransaction(values)
}

function encodeTransaction(
  values: Exclude<TransactionData, MultiTransactionData>
): Encoded<Exclude<TransactionData, MultiTransactionData>> {
  switch (values.type) {
    case 'Deposit':
      return encodeDepositTransaction(values)
    case 'WithdrawToAddress':
      return encodeWithdrawToAddressTransaction(values)
    case 'ForcedWithdrawal':
      return encodeForcedWithdrawalTransaction(values)
    case 'Trade':
      return encodeTradeTransaction(values)
    case 'ForcedTrade':
      return encodeForcedTradeTransaction(values)
    case 'Transfer':
      return encodeTransferTransaction(values)
    case 'ConditionalTransfer':
      return encodeConditionalTransferTransaction(values)
    case 'Liquidate':
      return encodeLiquidateTransaction(values)
    case 'Deleverage':
      return encodeDeleverageTransaction(values)
    case 'FundingTick':
      return encodeFundingTickTransaction(values)
    case 'OraclePricesTick':
      return encodeOraclePricesTickTransaction(values)
    default:
      assertUnreachable(values)
  }
}

function decodeTransaction(
  values: ToJSON<Exclude<TransactionData, MultiTransactionData>>
): Exclude<TransactionData, MultiTransactionData> {
  switch (values.type) {
    case 'Deposit':
      return decodeDepositTransaction(values)
    case 'WithdrawToAddress':
      return decodeWithdrawToAddressTransaction(values)
    case 'ForcedWithdrawal':
      return decodeForcedWithdrawalTransaction(values)
    case 'Trade':
      return decodeTradeTransaction(values)
    case 'ForcedTrade':
      return decodeForcedTradeTransaction(values)
    case 'Transfer':
      return decodeTransferTransaction(values)
    case 'ConditionalTransfer':
      return decodeConditionalTransferTransaction(values)
    case 'Liquidate':
      return decodeLiquidateTransaction(values)
    case 'Deleverage':
      return decodeDeleverageTransaction(values)
    case 'FundingTick':
      return decodeFundingTickTransaction(values)
    case 'OraclePricesTick':
      return decodeOraclePricesTickTransaction(values)
    default:
      assertUnreachable(values)
  }
}

function encodeDepositTransaction(
  values: DepositTransactionData
): Encoded<DepositTransactionData> {
  return {
    starkKeyA: values.starkKey,
    starkKeyB: null,
    data: {
      ...values,
      positionId: values.positionId.toString(),
      starkKey: values.starkKey.toString(),
      amount: values.amount.toString(),
    },
  }
}

function decodeDepositTransaction(
  values: ToJSON<DepositTransactionData>
): DepositTransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}
function encodeWithdrawToAddressTransaction(
  values: WithdrawToAddressTransactionData
): Encoded<WithdrawToAddressTransactionData> {
  return {
    starkKeyA: values.starkKey,
    starkKeyB: null,
    data: {
      ...values,
      positionId: values.positionId.toString(),
      starkKey: values.starkKey.toString(),
      ethereumAddress: values.ethereumAddress.toString(),
      amount: values.amount.toString(),
      nonce: values.nonce.toString(),
      expirationTimestamp: values.expirationTimestamp.toString(),
      signature: encodeSignature(values.signature),
    },
  }
}

function decodeWithdrawToAddressTransaction(
  values: ToJSON<WithdrawToAddressTransactionData>
): WithdrawToAddressTransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    ethereumAddress: EthereumAddress(values.ethereumAddress),
    amount: BigInt(values.amount),
    nonce: BigInt(values.nonce),
    expirationTimestamp: Timestamp(values.expirationTimestamp),
    signature: decodeSignature(values.signature),
  }
}

function encodeForcedWithdrawalTransaction(
  values: ForcedWithdrawalTransactionData
): Encoded<ForcedWithdrawalTransactionData> {
  return {
    starkKeyA: values.starkKey,
    starkKeyB: null,
    data: {
      ...values,
      positionId: values.positionId.toString(),
      starkKey: values.starkKey.toString(),
      amount: values.amount.toString(),
    },
  }
}
function decodeForcedWithdrawalTransaction(
  values: ToJSON<ForcedWithdrawalTransactionData>
): ForcedWithdrawalTransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}

function encodeForcedTradeTransaction(
  values: ForcedTradeTransactionData
): Encoded<ForcedTradeTransactionData> {
  return {
    starkKeyA: values.starkKeyA,
    starkKeyB: values.starkKeyB,
    data: {
      ...values,
      positionIdA: values.positionIdA.toString(),
      positionIdB: values.positionIdB.toString(),
      collateralAssetId: values.collateralAssetId.toString(),
      syntheticAssetId: values.syntheticAssetId.toString(),
      collateralAmount: values.collateralAmount.toString(),
      syntheticAmount: values.syntheticAmount.toString(),
      starkKeyA: values.starkKeyA.toString(),
      starkKeyB: values.starkKeyB.toString(),
      nonce: values.nonce.toString(),
    },
  }
}

function decodeForcedTradeTransaction(
  values: ToJSON<ForcedTradeTransactionData>
): ForcedTradeTransactionData {
  return {
    ...values,
    positionIdA: BigInt(values.positionIdA),
    positionIdB: BigInt(values.positionIdB),
    collateralAssetId: AssetHash(values.collateralAssetId),
    syntheticAssetId: AssetId(values.syntheticAssetId),
    starkKeyA: StarkKey(values.starkKeyA),
    starkKeyB: StarkKey(values.starkKeyB),
    collateralAmount: BigInt(values.collateralAmount),
    syntheticAmount: BigInt(values.syntheticAmount),
    nonce: BigInt(values.nonce),
  }
}

function encodeTradeTransaction(
  values: TradeTransactionData
): Encoded<TradeTransactionData> {
  return {
    starkKeyA: values.partyAOrder.starkKey,
    starkKeyB: values.partyBOrder.starkKey,
    data: {
      ...values,
      partyAOrder: encodePartyOrder(values.partyAOrder),
      partyBOrder: encodePartyOrder(values.partyBOrder),
      actualBFee: values.actualBFee.toString(),
      actualAFee: values.actualAFee.toString(),
      actualSynthetic: values.actualSynthetic.toString(),
      actualCollateral: values.actualCollateral.toString(),
    },
  }
}

function decodeTradeTransaction(
  values: ToJSON<TradeTransactionData>
): TradeTransactionData {
  return {
    ...values,
    partyAOrder: decodePartyOrder(values.partyAOrder),
    partyBOrder: decodePartyOrder(values.partyBOrder),
    actualBFee: BigInt(values.actualBFee),
    actualAFee: BigInt(values.actualAFee),
    actualSynthetic: BigInt(values.actualSynthetic),
    actualCollateral: BigInt(values.actualCollateral),
  }
}

function encodeTransferTransaction(
  values: TransferTransactionData
): Encoded<TransferTransactionData> {
  return {
    starkKeyA: values.senderStarkKey,
    starkKeyB: values.receiverStarkKey,
    data: {
      ...values,
      amount: values.amount.toString(),
      nonce: values.nonce.toString(),
      senderPositionId: values.senderPositionId.toString(),
      receiverPositionId: values.receiverPositionId.toString(),
      assetId: values.assetId.toString(),
      expirationTimestamp: values.expirationTimestamp.toString(),
      senderStarkKey: values.senderStarkKey.toString(),
      receiverStarkKey: values.receiverStarkKey.toString(),
      signature: encodeSignature(values.signature),
    },
  }
}

function decodeTransferTransaction(
  values: ToJSON<TransferTransactionData>
): TransferTransactionData {
  return {
    ...values,
    amount: BigInt(values.amount),
    nonce: BigInt(values.nonce),
    senderPositionId: BigInt(values.senderPositionId),
    receiverPositionId: BigInt(values.receiverPositionId),
    assetId: AssetHash(values.assetId),
    expirationTimestamp: Timestamp(values.expirationTimestamp),
    senderStarkKey: StarkKey(values.senderStarkKey),
    receiverStarkKey: StarkKey(values.receiverStarkKey),
    signature: decodeSignature(values.signature),
  }
}

function encodeConditionalTransferTransaction(
  values: ConditionalTransferTransactionData
): Encoded<ConditionalTransferTransactionData> {
  return {
    starkKeyA: values.senderStarkKey,
    starkKeyB: values.receiverStarkKey,
    data: {
      ...values,
      amount: values.amount.toString(),
      nonce: values.nonce.toString(),
      senderPositionId: values.senderPositionId.toString(),
      receiverPositionId: values.receiverPositionId.toString(),
      assetId: values.assetId.toString(),
      expirationTimestamp: values.expirationTimestamp.toString(),
      senderStarkKey: values.senderStarkKey.toString(),
      receiverStarkKey: values.receiverStarkKey.toString(),
      factRegistryAddress: values.factRegistryAddress.toString(),
      fact: values.fact.toString(),
      signature: encodeSignature(values.signature),
    },
  }
}

function decodeConditionalTransferTransaction(
  values: ToJSON<ConditionalTransferTransactionData>
): ConditionalTransferTransactionData {
  return {
    ...values,
    amount: BigInt(values.amount),
    nonce: BigInt(values.nonce),
    senderPositionId: BigInt(values.senderPositionId),
    receiverPositionId: BigInt(values.receiverPositionId),
    assetId: AssetHash(values.assetId),
    expirationTimestamp: Timestamp(values.expirationTimestamp),
    senderStarkKey: StarkKey(values.senderStarkKey),
    receiverStarkKey: StarkKey(values.receiverStarkKey),
    fact: Hash256(values.fact),
    signature: decodeSignature(values.signature),
    factRegistryAddress: EthereumAddress(values.factRegistryAddress),
  }
}

function encodeLiquidateTransaction(
  values: LiquidateTransactionData
): Encoded<LiquidateTransactionData> {
  return {
    starkKeyA: values.liquidatorOrder.starkKey,
    starkKeyB: null,
    data: {
      ...values,
      liquidatorOrder: encodeLiquidateOrder(values.liquidatorOrder),
      liquidatedPositionId: values.liquidatedPositionId.toString(),
      actualCollateral: values.actualCollateral.toString(),
      actualSynthetic: values.actualSynthetic.toString(),
      actualLiquidatorFee: values.actualLiquidatorFee.toString(),
    },
  }
}

function decodeLiquidateTransaction(
  values: ToJSON<LiquidateTransactionData>
): LiquidateTransactionData {
  return {
    ...values,
    liquidatorOrder: decodeLiquidateOrder(values.liquidatorOrder),
    liquidatedPositionId: BigInt(values.liquidatedPositionId),
    actualCollateral: BigInt(values.actualCollateral),
    actualSynthetic: BigInt(values.actualSynthetic),
    actualLiquidatorFee: BigInt(values.actualLiquidatorFee),
  }
}

function encodeDeleverageTransaction(
  values: DeleverageTransactionData
): Encoded<DeleverageTransactionData> {
  return {
    starkKeyA: null,
    starkKeyB: null,
    data: {
      ...values,
      syntheticAmount: values.syntheticAmount.toString(),
      collateralAmount: values.collateralAmount.toString(),
      deleveragedPositionId: values.deleveragedPositionId.toString(),
      deleveragerPositionId: values.deleveragerPositionId.toString(),
      syntheticAssetId: values.syntheticAssetId.toString(),
    },
  }
}

function decodeDeleverageTransaction(
  values: ToJSON<DeleverageTransactionData>
): DeleverageTransactionData {
  return {
    ...values,
    syntheticAmount: BigInt(values.syntheticAmount),
    collateralAmount: BigInt(values.collateralAmount),
    deleveragedPositionId: BigInt(values.deleveragedPositionId),
    deleveragerPositionId: BigInt(values.deleveragerPositionId),
    syntheticAssetId: AssetId(values.syntheticAssetId),
  }
}

function encodeFundingTickTransaction(
  values: FundingTickTransactionData
): Encoded<FundingTickTransactionData> {
  return {
    starkKeyA: null,
    starkKeyB: null,
    data: {
      ...values,
      globalFundingIndices: {
        ...values.globalFundingIndices,
        indices: values.globalFundingIndices.indices.map((index) => ({
          ...index,
          syntheticAssetId: index.syntheticAssetId.toString(),
        })),
        timestamp: values.globalFundingIndices.timestamp.toString(),
      },
    },
  }
}

function decodeFundingTickTransaction(
  values: ToJSON<FundingTickTransactionData>
): FundingTickTransactionData {
  return {
    ...values,
    globalFundingIndices: {
      ...values.globalFundingIndices,
      indices: values.globalFundingIndices.indices.map((index) => ({
        ...index,
        syntheticAssetId: AssetId(index.syntheticAssetId),
      })),

      timestamp: Timestamp(values.globalFundingIndices.timestamp),
    },
  }
}

function encodeOraclePricesTickTransaction(
  values: OraclePricesTickTransactionData
): Encoded<OraclePricesTickTransactionData> {
  return {
    starkKeyA: null,
    starkKeyB: null,
    data: {
      ...values,
      oraclePrices: values.oraclePrices.map(encodeAssetOraclePrice),
      timestamp: values.timestamp.toString(),
    },
  }
}

function decodeOraclePricesTickTransaction(
  values: ToJSON<OraclePricesTickTransactionData>
): OraclePricesTickTransactionData {
  return {
    ...values,
    oraclePrices: values.oraclePrices.map(decodeAssetOraclePrice),
    timestamp: Timestamp(values.timestamp),
  }
}

function encodeMultiTransaction(
  values: MultiTransactionData
): Encoded<MultiTransactionData> {
  return {
    ...values,
    starkKeyA: null,
    starkKeyB: null,
    data: {
      transactions: values.transactions.map((tx) => encodeTransaction(tx).data),
      type: 'MultiTransaction',
    },
  }
}

function decodeMultiTransaction(
  values: ToJSON<MultiTransactionData>
): MultiTransactionData {
  return {
    ...values,
    transactions: values.transactions.map((tx) => decodeTransaction(tx)),
  }
}

function encodeAssetOraclePrice(
  values: AssetOraclePrice
): ToJSON<AssetOraclePrice> {
  return {
    ...values,
    syntheticAssetId: values.syntheticAssetId.toString(),
    price: values.price.toString(),
    signedPrices: values.signedPrices.map(encodeSignedOraclePrice),
  }
}

function decodeAssetOraclePrice(
  values: ToJSON<AssetOraclePrice>
): AssetOraclePrice {
  return {
    ...values,
    syntheticAssetId: AssetId(values.syntheticAssetId),
    price: BigInt(values.price),
    signedPrices: values.signedPrices.map(decodeSignedOraclePrice),
  }
}

function encodeSignedOraclePrice(
  values: SignedOraclePrice
): ToJSON<SignedOraclePrice> {
  return {
    ...values,
    signerPublicKey: values.signerPublicKey.toString(),
    externalAssetId: values.externalAssetId.toString(),
    price: values.price.toString(),
    timestampedSignature: {
      timestamp: values.timestampedSignature.timestamp.toString(),
      signature: encodeSignature(values.timestampedSignature.signature),
    },
  }
}

function decodeSignedOraclePrice(
  values: ToJSON<SignedOraclePrice>
): SignedOraclePrice {
  return {
    ...values,
    signerPublicKey: Hash256(values.signerPublicKey),
    externalAssetId: AssetHash(values.externalAssetId),
    price: BigInt(values.price),
    timestampedSignature: {
      signature: decodeSignature(values.timestampedSignature.signature),
      timestamp: Timestamp(values.timestampedSignature.timestamp),
    },
  }
}

function encodeLiquidateOrder(values: LiquidateOrder): ToJSON<LiquidateOrder> {
  return {
    ...values,
    nonce: values.nonce.toString(),
    starkKey: values.starkKey.toString(),
    syntheticAssetId: values.syntheticAssetId.toString(),
    syntheticAmount: values.syntheticAmount.toString(),
    collateralAssetId: values.collateralAssetId.toString(),
    collateralAmount: values.collateralAmount.toString(),
    feeAmount: values.feeAmount.toString(),
    positionId: values.positionId.toString(),
    expirationTimestamp: values.expirationTimestamp.toString(),
    signature: encodeSignature(values.signature),
  }
}

function decodeLiquidateOrder(values: ToJSON<LiquidateOrder>): LiquidateOrder {
  return {
    ...values,
    nonce: BigInt(values.nonce),
    starkKey: StarkKey(values.starkKey),
    syntheticAssetId: AssetId(values.syntheticAssetId),
    syntheticAmount: BigInt(values.syntheticAmount),
    collateralAssetId: AssetHash(values.collateralAssetId),
    collateralAmount: BigInt(values.collateralAmount),
    feeAmount: BigInt(values.feeAmount),
    positionId: BigInt(values.positionId),
    signature: decodeSignature(values.signature),
    expirationTimestamp: Timestamp(values.expirationTimestamp),
  }
}

function encodePartyOrder(values: PartyOrder): ToJSON<PartyOrder> {
  return {
    ...values,
    nonce: values.nonce.toString(),
    expirationTimestamp: values.expirationTimestamp.toString(),
    syntheticAssetId: values.syntheticAssetId.toString(),
    collateralAssetId: values.collateralAssetId.toString(),
    positionId: values.positionId.toString(),
    syntheticAmount: values.syntheticAmount.toString(),
    feeAmount: values.feeAmount.toString(),
    starkKey: values.starkKey.toString(),
    signature: encodeSignature(values.signature),
    collateralAmount: values.collateralAmount.toString(),
  }
}

function decodePartyOrder(values: ToJSON<PartyOrder>): PartyOrder {
  return {
    ...values,
    nonce: BigInt(values.nonce),
    expirationTimestamp: Timestamp(values.expirationTimestamp),
    syntheticAssetId: AssetId(values.syntheticAssetId),
    collateralAssetId: AssetHash(values.collateralAssetId),
    positionId: BigInt(values.positionId),
    syntheticAmount: BigInt(values.syntheticAmount),
    feeAmount: BigInt(values.feeAmount),
    starkKey: StarkKey(values.starkKey),
    signature: decodeSignature(values.signature),
    collateralAmount: BigInt(values.collateralAmount),
  }
}

function encodeSignature(values: Signature): ToJSON<Signature> {
  return {
    r: values.r.toString(),
    s: values.s.toString(),
  }
}

function decodeSignature(values: ToJSON<Signature>): Signature {
  return {
    r: Hash256(values.r),
    s: Hash256(values.s),
  }
}
