import { AssetId, StarkKey, Timestamp } from '@explorer/types'

type ToJSON<T> = {
  [K in keyof T]: T[K] extends bigint | StarkKey | Timestamp | AssetId
    ? string
    : T[K]
}

interface Encoded<T> {
  starkKey: StarkKey
  vaultOrPositionId: bigint
  data: ToJSON<T>
}

export type SentTransactionData = ForcedTradeData | ForcedWithdrawalData

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

export function encodeSentTransactionData(
  values: SentTransactionData
): Encoded<SentTransactionData> {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return encodeForcedWithdrawal(values)
    case 'ForcedTrade':
      return encodeForcedTrade(values)
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
