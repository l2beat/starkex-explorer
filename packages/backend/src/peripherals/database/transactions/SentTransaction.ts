import { AssetId, StarkKey, Timestamp } from '@explorer/types'

type ToJSON<T> = {
  [K in keyof T]: T[K] extends bigint | StarkKey | Timestamp ? string : T[K]
}

interface Encoded<T> {
  starkKey: StarkKey
  vaultOrPositionId: bigint
  data: ToJSON<T>
}

export type SentTransactionData = ForcedTrade | ForcedWithdrawal

export type SentTransactionJSON = ToJSON<SentTransactionData>

export interface ForcedWithdrawal {
  type: 'ForcedWithdrawal'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
  premiumCost: boolean
}

export interface ForcedTrade {
  type: 'ForcedTrade'
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  positionIdA: bigint
  positionIdB: bigint
  collateralAssetId: AssetId
  syntheticAssetId: AssetId
  collateralAmount: bigint
  syntheticAmount: bigint
  isABuyingSynthetic: boolean
  submissionExpirationTime: Timestamp
  nonce: bigint
  signatureB: string
  premiumCost: boolean
  offerId?: number
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
  values: ForcedWithdrawal
): Encoded<ForcedWithdrawal> {
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
  values: ToJSON<ForcedWithdrawal>
): ForcedWithdrawal {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    positionId: BigInt(values.positionId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeForcedTrade(values: ForcedTrade): Encoded<ForcedTrade> {
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
      syntheticAmount: values.syntheticAmount.toString(),
      submissionExpirationTime: values.submissionExpirationTime.toString(),
      nonce: values.nonce.toString(),
    },
  }
}

function decodeForcedTrade(values: ToJSON<ForcedTrade>): ForcedTrade {
  return {
    ...values,
    starkKeyA: StarkKey(values.starkKeyA),
    starkKeyB: StarkKey(values.starkKeyB),
    positionIdA: BigInt(values.positionIdA),
    positionIdB: BigInt(values.positionIdB),
    collateralAmount: BigInt(values.collateralAmount),
    syntheticAmount: BigInt(values.syntheticAmount),
    submissionExpirationTime: Timestamp(
      Number(values.submissionExpirationTime)
    ),
    nonce: BigInt(values.nonce),
  }
}
