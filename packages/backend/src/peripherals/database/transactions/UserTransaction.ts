import { AssetId, EthereumAddress, StarkKey } from '@explorer/types'

import { ToJSON } from './ToJSON'

interface Encoded<T> {
  starkKeyA: StarkKey
  starkKeyB?: StarkKey
  vaultOrPositionIdA?: bigint
  vaultOrPositionIdB?: bigint
  data: ToJSON<T>
}

export type UserTransactionData =
  | ForcedTradeData
  | ForcedWithdrawalData
  | WithdrawData

export type UserTransactionJSON = ToJSON<UserTransactionData>

export interface ForcedWithdrawalData {
  type: 'ForcedWithdrawal'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
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
  nonce: bigint
}

export interface WithdrawData {
  type: 'Withdraw'
  starkKey: StarkKey
  assetType: string
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export function encodeUserTransactionData(
  values: UserTransactionData
): Encoded<UserTransactionData> {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return encodeForcedWithdrawal(values)
    case 'ForcedTrade':
      return encodeForcedTrade(values)
    case 'Withdraw':
      return encodeWithdraw(values)
  }
}

export function decodeUserTransactionData(
  values: ToJSON<UserTransactionData>
): UserTransactionData {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return decodeForcedWithdrawal(values)
    case 'ForcedTrade':
      return decodeForcedTrade(values)
    case 'Withdraw':
      return decodeWithdraw(values)
  }
}

function encodeForcedWithdrawal(
  values: ForcedWithdrawalData
): Encoded<ForcedWithdrawalData> {
  return {
    starkKeyA: values.starkKey,
    vaultOrPositionIdA: values.positionId,
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
    starkKeyA: values.starkKeyA,
    starkKeyB: values.starkKeyB,
    vaultOrPositionIdA: values.positionIdA,
    vaultOrPositionIdB: values.positionIdB,
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
    nonce: BigInt(values.nonce),
  }
}

function encodeWithdraw(values: WithdrawData): Encoded<WithdrawData> {
  return {
    starkKeyA: values.starkKey,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
      recipient: values.recipient.toString(),
    },
  }
}

function decodeWithdraw(values: ToJSON<WithdrawData>): WithdrawData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}
