import { AssetHash, EthereumAddress, StarkKey } from '@explorer/types'

import { assertUnreachable } from '../../utils/assertUnreachable'
import { ToJSON } from './transactions/ToJSON'

export type WithdrawableBalanceChangeData =
  | WithdrawalAllowedData
  | MintableWithdrawalAllowedData
  | AssetWithdrawalAllowedData
  | WithdrawalPerformedData
  | WithdrawalWithTokenIdPerformedData
  | MintWithdrawalPerformedData

export type WithdrawableBalanceChangeJSON =
  ToJSON<WithdrawableBalanceChangeData>

interface Encoded<T> {
  starkKey: StarkKey
  assetHash: AssetHash
  balanceDelta: bigint
  data: ToJSON<T>
}

export interface WithdrawalAllowedData {
  event: 'LogWithdrawalAllowed'
  starkKey: StarkKey
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
}

export interface MintableWithdrawalAllowedData {
  event: 'LogMintableWithdrawalAllowed'
  starkKey: StarkKey
  assetId: AssetHash
  quantizedAmount: bigint
}

export interface AssetWithdrawalAllowedData {
  event: 'LogAssetWithdrawalAllowed'
  starkKey: StarkKey
  assetId: AssetHash
  quantizedAmount: bigint
}

export interface WithdrawalPerformedData {
  event: 'LogWithdrawalPerformed'
  starkKey: StarkKey
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export interface WithdrawalWithTokenIdPerformedData {
  event: 'LogWithdrawalWithTokenIdPerformed'
  starkKey: StarkKey
  assetType: AssetHash
  tokenId: bigint
  assetId: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  recipient: EthereumAddress
}

export interface MintWithdrawalPerformedData {
  event: 'LogMintWithdrawalPerformed'
  starkKey: StarkKey
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
  assetId: AssetHash
}

export function encodeWithdrawableBalanceChangeData(
  values: WithdrawableBalanceChangeData
): Encoded<WithdrawableBalanceChangeData> {
  switch (values.event) {
    case 'LogWithdrawalAllowed':
      return encodeWithdrawalAllowed(values)
    case 'LogMintableWithdrawalAllowed':
      return encodeMintableWithdrawalAllowed(values)
    case 'LogAssetWithdrawalAllowed':
      return encodeAssetWithdrawalAllowed(values)
    case 'LogWithdrawalPerformed':
      return encodeWithdrawalPerformed(values)
    case 'LogWithdrawalWithTokenIdPerformed':
      return encodeWithdrawalWithTokenIdPerformed(values)
    case 'LogMintWithdrawalPerformed':
      return encodeMintWithdrawalPerformed(values)
    default:
      assertUnreachable(values)
  }
}

export function decodeWithdrawableBalanceChangeData(
  values: ToJSON<WithdrawableBalanceChangeData>
): WithdrawableBalanceChangeData {
  switch (values.event) {
    case 'LogWithdrawalAllowed':
      return decodeWithdrawalAllowed(values)
    case 'LogMintableWithdrawalAllowed':
      return decodeMintableWithdrawalAllowed(values)
    case 'LogAssetWithdrawalAllowed':
      return decodeAssetWithdrawalAllowed(values)
    case 'LogWithdrawalPerformed':
      return decodeWithdrawalPerformed(values)
    case 'LogWithdrawalWithTokenIdPerformed':
      return decodeWithdrawalWithTokenIdPerformed(values)
    case 'LogMintWithdrawalPerformed':
      return decodeMintWithdrawalPerformed(values)
    default:
      assertUnreachable(values)
  }
}

function encodeWithdrawalAllowed(
  values: WithdrawalAllowedData
): Encoded<WithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetType, // for ERC-20, AssetType *is* the AssetHash
    balanceDelta: -values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType,
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function encodeMintableWithdrawalAllowed(
  values: MintableWithdrawalAllowedData
): Encoded<MintableWithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: -values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetId: values.assetId,
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function encodeAssetWithdrawalAllowed(
  values: AssetWithdrawalAllowedData
): Encoded<AssetWithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: -values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetId: values.assetId,
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function encodeWithdrawalPerformed(
  values: WithdrawalPerformedData
): Encoded<WithdrawalPerformedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetType, // for ERC-20, AssetType *is* the AssetHash
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType,
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
      recipient: values.recipient.toString(),
    },
  }
}

function encodeWithdrawalWithTokenIdPerformed(
  values: WithdrawalWithTokenIdPerformedData
): Encoded<WithdrawalWithTokenIdPerformedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType,
      tokenId: values.tokenId.toString(),
      assetId: values.assetId,
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
      recipient: values.recipient.toString(),
    },
  }
}

function encodeMintWithdrawalPerformed(
  values: MintWithdrawalPerformedData
): Encoded<MintWithdrawalPerformedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType,
      assetId: values.assetId,
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeWithdrawalAllowed(
  values: ToJSON<WithdrawalAllowedData>
): WithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: values.assetType,
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function decodeMintableWithdrawalAllowed(
  values: ToJSON<MintableWithdrawalAllowedData>
): MintableWithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetId: values.assetId,
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function decodeAssetWithdrawalAllowed(
  values: ToJSON<AssetWithdrawalAllowedData>
): AssetWithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetId: values.assetId,
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function decodeWithdrawalPerformed(
  values: ToJSON<WithdrawalPerformedData>
): WithdrawalPerformedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: values.assetType,
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}

function decodeWithdrawalWithTokenIdPerformed(
  values: ToJSON<WithdrawalWithTokenIdPerformedData>
): WithdrawalWithTokenIdPerformedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: values.assetType,
    tokenId: BigInt(values.tokenId),
    assetId: values.assetId,
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}

function decodeMintWithdrawalPerformed(
  values: ToJSON<MintWithdrawalPerformedData>
): MintWithdrawalPerformedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: values.assetType,
    assetId: values.assetId,
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}
