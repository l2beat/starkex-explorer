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

export type L2TransactionData =
  | DepositL2TransactionData
  | WithdrawalToAddressL2TransactionData
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

interface Encoded<T> {
  starkKeyA: StarkKey | null
  starkKeyB: StarkKey | null
  data: ToJSON<T>
}

export type L2TransactionDataJson = ToJSON<L2TransactionData>
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

export interface DepositL2TransactionData {
  positionId: bigint
  starkKey: StarkKey
  amount: bigint
  type: 'Deposit'
}

export interface WithdrawalToAddressL2TransactionData {
  positionId: bigint
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  amount: bigint
  nonce: bigint
  expirationTimestamp: Timestamp
  signature: Signature
  type: 'WithdrawalToAddress'
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
  partyAOrder: PartyOrder
  partyBOrder: PartyOrder
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
  signature: Signature
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

export interface LiquidateL2TransactionData {
  liquidatorOrder: LiquidateOrder
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

export interface OraclePricesTickL2TransactionData {
  timestamp: Timestamp
  oraclePrices: AssetOraclePrice[]
  type: 'OraclePricesTick'
}

export interface MultiL2TransactionData {
  transactions: Exclude<L2TransactionData, MultiL2TransactionData>[]
  type: 'MultiTransaction'
}

export function encodeL2TransactionData(
  values: L2TransactionData
): Encoded<L2TransactionData> {
  if (values.type === 'MultiTransaction') {
    return encodeL2MultiTransaction(values)
  }

  return encodeL2Transaction(values)
}

export function decodeTransactionData(
  values: ToJSON<L2TransactionData>
): L2TransactionData {
  if (values.type === 'MultiTransaction') {
    return decodeMultiTransaction(values)
  }

  return decodeTransaction(values)
}

function encodeL2Transaction(
  values: Exclude<L2TransactionData, MultiL2TransactionData>
): Encoded<Exclude<L2TransactionData, MultiL2TransactionData>> {
  switch (values.type) {
    case 'Deposit':
      return encodeDepositTransaction(values)
    case 'WithdrawalToAddress':
      return encodeWithdrawalToAddressTransaction(values)
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
  values: ToJSON<Exclude<L2TransactionData, MultiL2TransactionData>>
): Exclude<L2TransactionData, MultiL2TransactionData> {
  switch (values.type) {
    case 'Deposit':
      return decodeDepositTransaction(values)
    case 'WithdrawalToAddress':
      return decodeWithdrawalToAddressTransaction(values)
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
  values: DepositL2TransactionData
): Encoded<DepositL2TransactionData> {
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
  values: ToJSON<DepositL2TransactionData>
): DepositL2TransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}
function encodeWithdrawalToAddressTransaction(
  values: WithdrawalToAddressL2TransactionData
): Encoded<WithdrawalToAddressL2TransactionData> {
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

function decodeWithdrawalToAddressTransaction(
  values: ToJSON<WithdrawalToAddressL2TransactionData>
): WithdrawalToAddressL2TransactionData {
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
  values: ForcedWithdrawalL2TransactionData
): Encoded<ForcedWithdrawalL2TransactionData> {
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
  values: ToJSON<ForcedWithdrawalL2TransactionData>
): ForcedWithdrawalL2TransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}

function encodeForcedTradeTransaction(
  values: ForcedTradeL2TransactionData
): Encoded<ForcedTradeL2TransactionData> {
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
  values: ToJSON<ForcedTradeL2TransactionData>
): ForcedTradeL2TransactionData {
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
  values: TradeL2TransactionData
): Encoded<TradeL2TransactionData> {
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
  values: ToJSON<TradeL2TransactionData>
): TradeL2TransactionData {
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
  values: TransferL2TransactionData
): Encoded<TransferL2TransactionData> {
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
  values: ToJSON<TransferL2TransactionData>
): TransferL2TransactionData {
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
  values: ConditionalTransferL2TransactionData
): Encoded<ConditionalTransferL2TransactionData> {
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
  values: ToJSON<ConditionalTransferL2TransactionData>
): ConditionalTransferL2TransactionData {
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
  values: LiquidateL2TransactionData
): Encoded<LiquidateL2TransactionData> {
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
  values: ToJSON<LiquidateL2TransactionData>
): LiquidateL2TransactionData {
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
  values: DeleverageL2TransactionData
): Encoded<DeleverageL2TransactionData> {
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
  values: ToJSON<DeleverageL2TransactionData>
): DeleverageL2TransactionData {
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
  values: FundingTickL2TransactionData
): Encoded<FundingTickL2TransactionData> {
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
  values: ToJSON<FundingTickL2TransactionData>
): FundingTickL2TransactionData {
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
  values: OraclePricesTickL2TransactionData
): Encoded<OraclePricesTickL2TransactionData> {
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
  values: ToJSON<OraclePricesTickL2TransactionData>
): OraclePricesTickL2TransactionData {
  return {
    ...values,
    oraclePrices: values.oraclePrices.map(decodeAssetOraclePrice),
    timestamp: Timestamp(values.timestamp),
  }
}

function encodeL2MultiTransaction(
  values: MultiL2TransactionData
): Encoded<MultiL2TransactionData> {
  return {
    ...values,
    starkKeyA: null,
    starkKeyB: null,
    data: {
      transactions: values.transactions.map(
        (tx) => encodeL2Transaction(tx).data
      ),
      type: 'MultiTransaction',
    },
  }
}

function decodeMultiTransaction(
  values: ToJSON<MultiL2TransactionData>
): MultiL2TransactionData {
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
