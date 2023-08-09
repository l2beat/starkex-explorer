import { assertUnreachable } from '@explorer/shared'
import { AssetHash, AssetId, StarkKey, Timestamp } from '@explorer/types'

import { ToJSON } from './ToJSON'

interface Encoded<T> {
  starkKey: StarkKey
  vaultOrPositionId: bigint | undefined
  data: ToJSON<T>
}

export type SentTransactionData =
  | ForcedTradeData
  | ForcedWithdrawalData
  | WithdrawData
  | WithdrawWithTokenIdData
  | ForcedWithdrawalFreezeRequestData
  | ForcedTradeFreezeRequestData
  | FullWithdrawalFreezeRequestData
  | VerifyEscapeData
  | FinalizePerpetualEscapeData
  | FinalizeSpotEscapeData

export type SentTransactionJSON = ToJSON<SentTransactionData>

export interface ForcedWithdrawalData {
  type: 'ForcedWithdrawal'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
  premiumCost: boolean
}

export interface ForcedTradeData {
  type: 'ForcedTrade'
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAmount: bigint
  collateralAssetId: AssetId
  syntheticAmount: bigint
  syntheticAssetId: AssetId
  isABuyingSynthetic: boolean
  submissionExpirationTime: Timestamp
  nonce: bigint
  signatureB: string
  premiumCost: boolean
  offerId: number
}

export interface WithdrawData {
  type: 'Withdraw'
  starkKey: StarkKey
  assetType: AssetHash
}

export interface WithdrawWithTokenIdData {
  type: 'WithdrawWithTokenId'
  starkKey: StarkKey
  assetType: AssetHash
  tokenId: bigint
}

export interface ForcedWithdrawalFreezeRequestData {
  type: 'ForcedWithdrawalFreezeRequest'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
}

export interface ForcedTradeFreezeRequestData {
  type: 'ForcedTradeFreezeRequest'
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAssetId: AssetId
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  isABuyingSynthetic: boolean
  nonce: bigint
}

export interface FullWithdrawalFreezeRequestData {
  type: 'FullWithdrawalFreezeRequest'
  starkKey: StarkKey
  vaultId: bigint
}

export interface VerifyEscapeData {
  type: 'VerifyEscape'
  starkKey: StarkKey
  positionOrVaultId: bigint
}

export interface FinalizePerpetualEscapeData {
  type: 'FinalizePerpetualEscape'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
}

export interface FinalizeSpotEscapeData {
  type: 'FinalizeSpotEscape'
  starkKey: StarkKey
  vaultId: bigint
  quantizedAmount: bigint
  assetId: AssetHash
}

export function encodeSentTransactionData(
  values: SentTransactionData
): Encoded<SentTransactionData> {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return encodeForcedWithdrawal(values)
    case 'ForcedTrade':
      return encodeForcedTrade(values)
    case 'Withdraw':
      return encodeWithdraw(values)
    case 'WithdrawWithTokenId':
      return encodeWithdrawWithTokenId(values)
    case 'ForcedWithdrawalFreezeRequest':
      return encodeForcedWithdrawalFreezeRequest(values)
    case 'ForcedTradeFreezeRequest':
      return encodeForcedTradeFreezeRequest(values)
    case 'FullWithdrawalFreezeRequest':
      return encodeFullWithdrawalFreezeRequest(values)
    case 'VerifyEscape':
      return encodeVerifyEscape(values)
    case 'FinalizePerpetualEscape':
      return encodeFinalizePerpetualEscape(values)
    case 'FinalizeSpotEscape':
      return encodeFinalizeSpotEscape(values)
    default:
      assertUnreachable(values)
  }
}

export function decodeSentTransactionData(
  values: ToJSON<SentTransactionData>
): SentTransactionData {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return decodeForcedWithdrawal(values)
    case 'ForcedTrade':
      return decodeForcedTrade(values)
    case 'Withdraw':
      return decodeWithdraw(values)
    case 'WithdrawWithTokenId':
      return decodeWithdrawWithTokenId(values)
    case 'ForcedWithdrawalFreezeRequest':
      return decodeForcedWithdrawalFreezeRequest(values)
    case 'ForcedTradeFreezeRequest':
      return decodeForcedTradeFreezeRequest(values)
    case 'FullWithdrawalFreezeRequest':
      return decodeFullWithdrawalFreezeRequest(values)
    case 'VerifyEscape':
      return decodeVerifyEscape(values)
    case 'FinalizePerpetualEscape':
      return decodeFinalizePerpetualEscape(values)
    case 'FinalizeSpotEscape':
      return decodeFinalizeSpotEscape(values)
    default:
      assertUnreachable(values)
  }
}

function encodeForcedWithdrawal(
  values: ForcedWithdrawalData
): Encoded<ForcedWithdrawalData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      positionId: values.positionId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeForcedWithdrawal(
  values: ToJSON<ForcedWithdrawalData>
): ForcedWithdrawalData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionId: BigInt(values.positionId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeForcedTrade(values: ForcedTradeData): Encoded<ForcedTradeData> {
  return {
    starkKey: values.starkKeyA,
    vaultOrPositionId: values.positionIdA,
    data: {
      ...values,
      starkKeyA: values.starkKeyA.toString(),
      starkKeyB: values.starkKeyB.toString(),
      positionIdA: values.positionIdA.toString(),
      positionIdB: values.positionIdB.toString(),
      collateralAmount: values.collateralAmount.toString(),
      collateralAssetId: values.collateralAssetId.toString(),
      syntheticAmount: values.syntheticAmount.toString(),
      syntheticAssetId: values.syntheticAssetId.toString(),
      submissionExpirationTime: values.submissionExpirationTime.toString(),
      nonce: values.nonce.toString(),
    },
  }
}

function decodeForcedTrade(values: ToJSON<ForcedTradeData>): ForcedTradeData {
  return {
    ...values,
    starkKeyA: StarkKey(values.starkKeyA),
    starkKeyB: StarkKey(values.starkKeyB),
    positionIdA: BigInt(values.positionIdA),
    positionIdB: BigInt(values.positionIdB),
    collateralAmount: BigInt(values.collateralAmount),
    collateralAssetId: AssetId(values.collateralAssetId),
    syntheticAmount: BigInt(values.syntheticAmount),
    syntheticAssetId: AssetId(values.syntheticAssetId),
    submissionExpirationTime: Timestamp(
      Number(values.submissionExpirationTime)
    ),
    nonce: BigInt(values.nonce),
  }
}

function encodeWithdraw(values: WithdrawData): Encoded<WithdrawData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: undefined,
    data: {
      ...values,
      assetType: values.assetType.toString(),
      starkKey: values.starkKey.toString(),
    },
  }
}

function decodeWithdraw(values: ToJSON<WithdrawData>): WithdrawData {
  return {
    ...values,
    assetType: AssetHash(values.assetType),
    starkKey: StarkKey(values.starkKey),
  }
}

function encodeWithdrawWithTokenId(
  values: WithdrawWithTokenIdData
): Encoded<WithdrawWithTokenIdData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: undefined,
    data: {
      ...values,
      assetType: values.assetType.toString(),
      starkKey: values.starkKey.toString(),
      tokenId: values.tokenId.toString(),
    },
  }
}

function decodeWithdrawWithTokenId(
  values: ToJSON<WithdrawWithTokenIdData>
): WithdrawWithTokenIdData {
  return {
    ...values,
    assetType: AssetHash(values.assetType),
    starkKey: StarkKey(values.starkKey),
    tokenId: BigInt(values.tokenId),
  }
}

function encodeVerifyEscape(
  values: VerifyEscapeData
): Encoded<VerifyEscapeData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionOrVaultId,
    data: {
      type: 'VerifyEscape',
      starkKey: values.starkKey.toString(),
      positionOrVaultId: values.positionOrVaultId.toString(),
    },
  }
}

function decodeVerifyEscape(
  values: ToJSON<VerifyEscapeData>
): VerifyEscapeData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionOrVaultId: BigInt(values.positionOrVaultId),
  }
}

function encodeForcedWithdrawalFreezeRequest(
  values: ForcedWithdrawalFreezeRequestData
): Encoded<ForcedWithdrawalFreezeRequestData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      positionId: values.positionId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeForcedWithdrawalFreezeRequest(
  values: ToJSON<ForcedWithdrawalFreezeRequestData>
): ForcedWithdrawalFreezeRequestData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionId: BigInt(values.positionId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeForcedTradeFreezeRequest(
  values: ForcedTradeFreezeRequestData
): Encoded<ForcedTradeFreezeRequestData> {
  return {
    starkKey: values.starkKeyA,
    vaultOrPositionId: values.positionIdA,
    data: {
      ...values,
      starkKeyA: values.starkKeyA.toString(),
      starkKeyB: values.starkKeyB.toString(),
      positionIdA: values.positionIdA.toString(),
      positionIdB: values.positionIdB.toString(),
      collateralAmount: values.collateralAmount.toString(),
      collateralAssetId: values.collateralAssetId.toString(),
      syntheticAmount: values.syntheticAmount.toString(),
      syntheticAssetId: values.syntheticAssetId.toString(),
      nonce: values.nonce.toString(),
    },
  }
}

function decodeForcedTradeFreezeRequest(
  values: ToJSON<ForcedTradeFreezeRequestData>
): ForcedTradeFreezeRequestData {
  return {
    ...values,
    starkKeyA: StarkKey(values.starkKeyA),
    starkKeyB: StarkKey(values.starkKeyB),
    positionIdA: BigInt(values.positionIdA),
    positionIdB: BigInt(values.positionIdB),
    collateralAmount: BigInt(values.collateralAmount),
    collateralAssetId: AssetId(values.collateralAssetId),
    syntheticAmount: BigInt(values.syntheticAmount),
    syntheticAssetId: AssetId(values.syntheticAssetId),
    nonce: BigInt(values.nonce),
  }
}

function encodeFullWithdrawalFreezeRequest(
  values: FullWithdrawalFreezeRequestData
): Encoded<FullWithdrawalFreezeRequestData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.vaultId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      vaultId: values.vaultId.toString(),
    },
  }
}

function decodeFullWithdrawalFreezeRequest(
  values: ToJSON<FullWithdrawalFreezeRequestData>
): FullWithdrawalFreezeRequestData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    vaultId: BigInt(values.vaultId),
  }
}

function encodeFinalizePerpetualEscape(
  values: FinalizePerpetualEscapeData
): Encoded<FinalizePerpetualEscapeData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      positionId: values.positionId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeFinalizePerpetualEscape(
  values: ToJSON<FinalizePerpetualEscapeData>
): FinalizePerpetualEscapeData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionId: BigInt(values.positionId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeFinalizeSpotEscape(
  values: FinalizeSpotEscapeData
): Encoded<FinalizeSpotEscapeData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.vaultId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      vaultId: values.vaultId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
      assetId: values.assetId.toString(),
    },
  }
}

function decodeFinalizeSpotEscape(
  values: ToJSON<FinalizeSpotEscapeData>
): FinalizeSpotEscapeData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    vaultId: BigInt(values.vaultId),
    quantizedAmount: BigInt(values.quantizedAmount),
    assetId: AssetHash(values.assetId),
  }
}
