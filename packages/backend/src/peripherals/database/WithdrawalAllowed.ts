import { assertUnreachable } from '@explorer/shared'
import { AssetHash, EthereumAddress, StarkKey } from '@explorer/types'

import { ToJSON } from './transactions/ToJSON'
import {
  MintWithdrawData,
  WithdrawalPerformedData,
  WithdrawData,
  WithdrawWithTokenIdData,
} from './transactions/UserTransaction'

export type WithdrawalAllowedData =
  | SpotWithdrawalAllowedData
  | MintableWithdrawalAllowedData
  | AssetWithdrawalAllowedData

export type WithdrawalAllowedJSON = ToJSON<WithdrawalAllowedData>

interface Encoded<T> {
  starkKey: StarkKey
  assetHash: AssetHash
  balanceDelta: bigint
  data: ToJSON<T>
}

export interface SpotWithdrawalAllowedData {
  type: 'WithdrawalAllowed'
  starkKey: StarkKey
  assetType: AssetHash
  nonQuantizedAmount: bigint
  quantizedAmount: bigint
}

export interface MintableWithdrawalAllowedData {
  type: 'MintableWithdrawalAllowed'
  starkKey: StarkKey
  assetId: AssetHash
  quantizedAmount: bigint
}

export interface AssetWithdrawalAllowedData {
  type: 'AssetWithdrawalAllowed'
  starkKey: StarkKey
  assetId: AssetHash
  quantizedAmount: bigint
}

export function encodeWithdrawableBalanceChangeData(
  values: WithdrawalAllowedData | WithdrawalPerformedData
): Encoded<WithdrawalAllowedData | WithdrawalPerformedData> {
  switch (values.type) {
    case 'WithdrawalAllowed':
      return encodeWithdrawalAllowed(values)
    case 'MintableWithdrawalAllowed':
      return encodeMintableWithdrawalAllowed(values)
    case 'AssetWithdrawalAllowed':
      return encodeAssetWithdrawalAllowed(values)
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

export function decodeWithdrawableBalanceChangeData(
  values: ToJSON<WithdrawalAllowedData | WithdrawalPerformedData>
): WithdrawalAllowedData | WithdrawalPerformedData {
  switch (values.type) {
    case 'WithdrawalAllowed':
      return decodeWithdrawalAllowed(values)
    case 'MintableWithdrawalAllowed':
      return decodeMintableWithdrawalAllowed(values)
    case 'AssetWithdrawalAllowed':
      return decodeAssetWithdrawalAllowed(values)
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

function encodeWithdrawalAllowed(
  values: SpotWithdrawalAllowedData
): Encoded<SpotWithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetType, // for ERC-20, AssetType *is* the AssetHash
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType.toString(),
      nonQuantizedAmount: values.nonQuantizedAmount.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeWithdrawalAllowed(
  values: ToJSON<SpotWithdrawalAllowedData>
): SpotWithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetType: AssetHash(values.assetType),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeMintableWithdrawalAllowed(
  values: MintableWithdrawalAllowedData
): Encoded<MintableWithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetId: values.assetId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeMintableWithdrawalAllowed(
  values: ToJSON<MintableWithdrawalAllowedData>
): MintableWithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetId: AssetHash(values.assetId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeAssetWithdrawalAllowed(
  values: AssetWithdrawalAllowedData
): Encoded<AssetWithdrawalAllowedData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetId: values.assetId.toString(),
      quantizedAmount: values.quantizedAmount.toString(),
    },
  }
}

function decodeAssetWithdrawalAllowed(
  values: ToJSON<AssetWithdrawalAllowedData>
): AssetWithdrawalAllowedData {
  return {
    ...values,
    starkKey: StarkKey(values.starkKey),
    assetId: AssetHash(values.assetId),
    quantizedAmount: BigInt(values.quantizedAmount),
  }
}

function encodeWithdraw(values: WithdrawData): Encoded<WithdrawData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetType, // for ERC-20, AssetType *is* the AssetHash
    balanceDelta: -values.quantizedAmount,
    data: {
      ...values,
      starkKey: values.starkKey.toString(),
      assetType: values.assetType.toString(),
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
    assetType: AssetHash(values.assetType),
    nonQuantizedAmount: BigInt(values.nonQuantizedAmount),
    quantizedAmount: BigInt(values.quantizedAmount),
    recipient: EthereumAddress(values.recipient),
  }
}

function encodeWithdrawWithTokenId(
  values: WithdrawWithTokenIdData
): Encoded<WithdrawWithTokenIdData> {
  return {
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: -values.quantizedAmount,
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
    starkKey: values.starkKey,
    assetHash: values.assetId,
    balanceDelta: -values.quantizedAmount,
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
