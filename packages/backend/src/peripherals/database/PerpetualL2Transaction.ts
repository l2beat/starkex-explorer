import {
  assertUnreachable,
  PerpetualL2ConditionalTransferTransactionData,
  PerpetualL2DeleverageTransactionData,
  PerpetualL2DepositTransactionData,
  PerpetualL2ForcedTradeTransactionData,
  PerpetualL2ForcedWithdrawalTransactionData,
  PerpetualL2FundingTickTransactionData,
  PerpetualL2LiquidateTransactionData,
  PerpetualL2MultiTransactionData,
  PerpetualL2OraclePricesTickTransactionData,
  PerpetualL2TradeTransactionData,
  PerpetualL2TransactionAssetOraclePrice,
  PerpetualL2TransactionData,
  PerpetualL2TransactionLiquidateOrder,
  PerpetualL2TransactionPartyOrder,
  PerpetualL2TransactionSignature,
  PerpetualL2TransactionSignedOraclePrice,
  PerpetualL2TransferTransactionData,
  PerpetualL2WithdrawToAddressTransactionData,
} from '@explorer/shared'
import {
  AssetHash,
  AssetId,
  EthereumAddress,
  Hash256,
  StarkKey,
  Timestamp,
} from '@explorer/types'

import { ToJSON } from './transactions/ToJSON'

interface Encoded<T> {
  starkKeyA: StarkKey | null
  starkKeyB: StarkKey | null
  data: ToJSON<T>
}

export type L2TransactionDataJson = ToJSON<PerpetualL2TransactionData>

export function encodeL2TransactionData(
  values: PerpetualL2TransactionData
): Encoded<PerpetualL2TransactionData> {
  if (values.type === 'MultiTransaction') {
    return encodeL2MultiTransaction(values)
  }

  return encodeL2Transaction(values)
}

export function decodeTransactionData(
  values: ToJSON<PerpetualL2TransactionData>
): PerpetualL2TransactionData {
  if (values.type === 'MultiTransaction') {
    return decodeMultiTransaction(values)
  }

  return decodeTransaction(values)
}

function encodeL2Transaction(
  values: Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData>
): Encoded<
  Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData>
> {
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
  values: ToJSON<
    Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData>
  >
): Exclude<PerpetualL2TransactionData, PerpetualL2MultiTransactionData> {
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
  values: PerpetualL2DepositTransactionData
): Encoded<PerpetualL2DepositTransactionData> {
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
  values: ToJSON<PerpetualL2DepositTransactionData>
): PerpetualL2DepositTransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}
function encodeWithdrawToAddressTransaction(
  values: PerpetualL2WithdrawToAddressTransactionData
): Encoded<PerpetualL2WithdrawToAddressTransactionData> {
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
  values: ToJSON<PerpetualL2WithdrawToAddressTransactionData>
): PerpetualL2WithdrawToAddressTransactionData {
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
  values: PerpetualL2ForcedWithdrawalTransactionData
): Encoded<PerpetualL2ForcedWithdrawalTransactionData> {
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
  values: ToJSON<PerpetualL2ForcedWithdrawalTransactionData>
): PerpetualL2ForcedWithdrawalTransactionData {
  return {
    ...values,
    positionId: BigInt(values.positionId),
    starkKey: StarkKey(values.starkKey),
    amount: BigInt(values.amount),
  }
}

function encodeForcedTradeTransaction(
  values: PerpetualL2ForcedTradeTransactionData
): Encoded<PerpetualL2ForcedTradeTransactionData> {
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
  values: ToJSON<PerpetualL2ForcedTradeTransactionData>
): PerpetualL2ForcedTradeTransactionData {
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
  values: PerpetualL2TradeTransactionData
): Encoded<PerpetualL2TradeTransactionData> {
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
  values: ToJSON<PerpetualL2TradeTransactionData>
): PerpetualL2TradeTransactionData {
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
  values: PerpetualL2TransferTransactionData
): Encoded<PerpetualL2TransferTransactionData> {
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
  values: ToJSON<PerpetualL2TransferTransactionData>
): PerpetualL2TransferTransactionData {
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
  values: PerpetualL2ConditionalTransferTransactionData
): Encoded<PerpetualL2ConditionalTransferTransactionData> {
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
  values: ToJSON<PerpetualL2ConditionalTransferTransactionData>
): PerpetualL2ConditionalTransferTransactionData {
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
  values: PerpetualL2LiquidateTransactionData
): Encoded<PerpetualL2LiquidateTransactionData> {
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
  values: ToJSON<PerpetualL2LiquidateTransactionData>
): PerpetualL2LiquidateTransactionData {
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
  values: PerpetualL2DeleverageTransactionData
): Encoded<PerpetualL2DeleverageTransactionData> {
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
  values: ToJSON<PerpetualL2DeleverageTransactionData>
): PerpetualL2DeleverageTransactionData {
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
  values: PerpetualL2FundingTickTransactionData
): Encoded<PerpetualL2FundingTickTransactionData> {
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
  values: ToJSON<PerpetualL2FundingTickTransactionData>
): PerpetualL2FundingTickTransactionData {
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
  values: PerpetualL2OraclePricesTickTransactionData
): Encoded<PerpetualL2OraclePricesTickTransactionData> {
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
  values: ToJSON<PerpetualL2OraclePricesTickTransactionData>
): PerpetualL2OraclePricesTickTransactionData {
  return {
    ...values,
    oraclePrices: values.oraclePrices.map(decodeAssetOraclePrice),
    timestamp: Timestamp(values.timestamp),
  }
}

function encodeL2MultiTransaction(
  values: PerpetualL2MultiTransactionData
): Encoded<PerpetualL2MultiTransactionData> {
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
  values: ToJSON<PerpetualL2MultiTransactionData>
): PerpetualL2MultiTransactionData {
  return {
    ...values,
    transactions: values.transactions.map((tx) => decodeTransaction(tx)),
  }
}

function encodeAssetOraclePrice(
  values: PerpetualL2TransactionAssetOraclePrice
): ToJSON<PerpetualL2TransactionAssetOraclePrice> {
  return {
    ...values,
    syntheticAssetId: values.syntheticAssetId.toString(),
    price: values.price.toString(),
    signedPrices: values.signedPrices.map(encodeSignedOraclePrice),
  }
}

function decodeAssetOraclePrice(
  values: ToJSON<PerpetualL2TransactionAssetOraclePrice>
): PerpetualL2TransactionAssetOraclePrice {
  return {
    ...values,
    syntheticAssetId: AssetId(values.syntheticAssetId),
    price: BigInt(values.price),
    signedPrices: values.signedPrices.map(decodeSignedOraclePrice),
  }
}

function encodeSignedOraclePrice(
  values: PerpetualL2TransactionSignedOraclePrice
): ToJSON<PerpetualL2TransactionSignedOraclePrice> {
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
  values: ToJSON<PerpetualL2TransactionSignedOraclePrice>
): PerpetualL2TransactionSignedOraclePrice {
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

function encodeLiquidateOrder(
  values: PerpetualL2TransactionLiquidateOrder
): ToJSON<PerpetualL2TransactionLiquidateOrder> {
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

function decodeLiquidateOrder(
  values: ToJSON<PerpetualL2TransactionLiquidateOrder>
): PerpetualL2TransactionLiquidateOrder {
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

function encodePartyOrder(
  values: PerpetualL2TransactionPartyOrder
): ToJSON<PerpetualL2TransactionPartyOrder> {
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

function decodePartyOrder(
  values: ToJSON<PerpetualL2TransactionPartyOrder>
): PerpetualL2TransactionPartyOrder {
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

function encodeSignature(
  values: PerpetualL2TransactionSignature
): ToJSON<PerpetualL2TransactionSignature> {
  return {
    r: values.r.toString(),
    s: values.s.toString(),
  }
}

function decodeSignature(
  values: ToJSON<PerpetualL2TransactionSignature>
): PerpetualL2TransactionSignature {
  return {
    r: Hash256(values.r),
    s: Hash256(values.s),
  }
}
