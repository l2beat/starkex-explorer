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
  | FreezeRequestData
  | EscapeVerifiedData
  | FinalizeEscapeData

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

export interface FreezeRequestData {
  type: 'FreezeRequest'
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export interface EscapeVerifiedData {
  type: 'EscapeVerified'
  starkKey: StarkKey
  positionOrVaultId: bigint
}

export interface FinalizeEscapeData {
  type: 'FinalizeEscape'
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
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
    case 'FreezeRequest':
      return encodeFreezeRequest(values)
    case 'EscapeVerified':
      return encodeEscapeVerified(values)
    case 'FinalizeEscape':
      return encodeFinalizeEscape(values)
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
    case 'FreezeRequest':
      return decodeFreezeRequest(values)
    case 'EscapeVerified':
      return decodeEscapeVerified(values)
    case 'FinalizeEscape':
      return decodeFinalizeEscape(values)
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

function encodeEscapeVerified(
  values: EscapeVerifiedData
): Encoded<EscapeVerifiedData> {
  const { starkKey, ...rest } = values
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionOrVaultId,
    data: {
      ...rest,
      starkKey: values.starkKey.toString(),
      positionOrVaultId: values.positionOrVaultId.toString(),
    },
  }
}

function decodeEscapeVerified(
  values: ToJSON<EscapeVerifiedData>
): EscapeVerifiedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionOrVaultId: BigInt(values.positionOrVaultId),
  }
}

function encodeFreezeRequest(
  values: FreezeRequestData
): Encoded<FreezeRequestData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionOrVaultId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      positionOrVaultId: values.positionOrVaultId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeFreezeRequest(
  values: ToJSON<FreezeRequestData>
): FreezeRequestData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionOrVaultId: BigInt(values.positionOrVaultId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeFinalizeEscape(
  values: FinalizeEscapeData
): Encoded<FinalizeEscapeData> {
  return {
    starkKey: values.starkKey,
    vaultOrPositionId: values.positionOrVaultId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      positionOrVaultId: values.positionOrVaultId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeFinalizeEscape(
  values: ToJSON<FinalizeEscapeData>
): FinalizeEscapeData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionOrVaultId: BigInt(values.positionOrVaultId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}
