import { assertUnreachable } from '@explorer/shared'
import { AssetHash, AssetId, EthereumAddress, StarkKey } from '@explorer/types'

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
  | FullWithdrawalData
  | WithdrawalPerformedData

export type WithdrawalPerformedData =
  | WithdrawData
  | WithdrawWithTokenIdData
  | MintWithdrawData

export type UserTransactionJSON = ToJSON<UserTransactionData>

export type WithdrawalPerformedJSON = ToJSON<WithdrawalPerformedData>

export interface ForcedWithdrawalData {
  type: 'ForcedWithdrawal'
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
}

export interface FullWithdrawalData {
  type: 'FullWithdrawal'
  starkKey: StarkKey
  vaultId: bigint
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
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export interface WithdrawWithTokenIdData {
  type: 'WithdrawWithTokenId'
  starkKey: StarkKey
  assetType: AssetHash
  tokenId: bigint
  assetId: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export interface MintWithdrawData {
  type: 'MintWithdraw'
  starkKey: StarkKey
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  assetId: AssetHash
}

export function encodeUserTransactionData(
  values: UserTransactionData
): Encoded<UserTransactionData> {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return encodeForcedWithdrawal(values)
    case 'FullWithdrawal':
      return encodeFullWithdrawal(values)
    case 'ForcedTrade':
      return encodeForcedTrade(values)
    case 'Withdraw':
      return encodeWithdraw(values)
    case 'WithdrawWithTokenId':
      return encodeWithdrawWithTokenId(values)
    case 'MintWithdraw':
      return encodeMintWithdraw(values)
    default:
      assertUnreachable(values)
  }
}

export function decodeUserTransactionData(
  values: ToJSON<UserTransactionData>
): UserTransactionData {
  switch (values.type) {
    case 'ForcedWithdrawal':
      return decodeForcedWithdrawal(values)
    case 'FullWithdrawal':
      return decodeFullWithdrawal(values)
    case 'ForcedTrade':
      return decodeForcedTrade(values)
    case 'Withdraw':
      return decodeWithdraw(values)
    case 'WithdrawWithTokenId':
      return decodeWithdrawWithTokenId(values)
    case 'MintWithdraw':
      return decodeMintWithdraw(values)
    default:
      assertUnreachable(values)
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

function encodeFullWithdrawal(
  values: FullWithdrawalData
): Encoded<FullWithdrawalData> {
  return {
    starkKeyA: values.starkKey,
    vaultOrPositionIdA: values.vaultId,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      vaultId: values.vaultId.toString(),
    },
  }
}

function decodeFullWithdrawal(
  values: ToJSON<FullWithdrawalData>
): FullWithdrawalData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    vaultId: BigInt(values.vaultId),
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
      assetType: values.assetType.toString(),
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
    assetType: AssetHash(values.assetType),
    starkKey: StarkKey(values.starkKey),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}

function encodeWithdrawWithTokenId(
  values: WithdrawWithTokenIdData
): Encoded<WithdrawWithTokenIdData> {
  return {
    starkKeyA: values.starkKey,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType.toString(),
      tokenId: values.tokenId.toString(),
      assetId: values.assetId.toString(),
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
      recipient: values.recipient.toString(),
    },
  }
}

function decodeWithdrawWithTokenId(
  values: ToJSON<WithdrawWithTokenIdData>
): WithdrawWithTokenIdData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: AssetHash(values.assetType),
    tokenId: BigInt(values.tokenId),
    assetId: AssetHash(values.assetId),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}

function encodeMintWithdraw(
  values: MintWithdrawData
): Encoded<MintWithdrawData> {
  return {
    starkKeyA: values.starkKey,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType.toString(),
      assetId: values.assetId.toString(),
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeMintWithdraw(
  values: ToJSON<MintWithdrawData>
): MintWithdrawData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: AssetHash(values.assetType),
    assetId: AssetHash(values.assetId),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}
