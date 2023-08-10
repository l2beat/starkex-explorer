import { Interface } from '@ethersproject/abi'
import { decodeAssetId, encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey } from '@explorer/types'

import { CollateralAsset } from './CollateralAsset'
import {
  validateCollateralAssetHashById,
  validateCollateralAssetIdByHash,
} from './utils'

const forcedWithdrawalFreezeRequestCoder = new Interface([
  'function freezeRequest(uint256,uint256,uint256)',
])
const forcedTradeFreezeRequestCoder = new Interface([
  'function freezeRequest(uint256 starkKeyA, uint256 starkKeyB, uint256 vaultIdA, uint256 vaultIdB, uint256 collateralAssetId, uint256 syntheticAssetId, uint256 amountCollateral, uint256 amountSynthetic, bool aIsBuyingSynthetic, uint256 nonce)',
])

const fullWithdrawalFreezeRequestCoder = new Interface([
  'function freezeRequest(uint256 ownerKey, uint256 vaultId)',
])

export interface ForcedWithdrawalFreezeRequest {
  starkKey: StarkKey
  positionId: bigint
  quantizedAmount: bigint
}

export function encodeForcedWithdrawalFreezeRequest(
  data: ForcedWithdrawalFreezeRequest
) {
  return forcedWithdrawalFreezeRequestCoder.encodeFunctionData(
    'freezeRequest',
    [data.starkKey, data.positionId.toString(), data.quantizedAmount.toString()]
  )
}

export function decodeForcedWithdrawalFreezeRequest(
  data: string
): ForcedWithdrawalFreezeRequest | undefined {
  try {
    const decoded = forcedWithdrawalFreezeRequestCoder.decodeFunctionData(
      'freezeRequest',
      data
    )
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.starkKey),
      positionId: BigInt(decoded.vaultId),
      quantizedAmount: BigInt(decoded.quantizedAmount),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}

export interface ForcedTradeFreezeRequest {
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

export function encodeForcedTradeFreezeRequest(
  data: ForcedTradeFreezeRequest,
  collateralAsset: CollateralAsset
) {
  return forcedTradeFreezeRequestCoder.encodeFunctionData('freezeRequest', [
    data.starkKeyA.toString(),
    data.starkKeyB.toString(),
    data.positionIdA.toString(),
    data.positionIdB.toString(),
    // TODO: Use this in other files
    validateCollateralAssetHashById(data.collateralAssetId, collateralAsset),
    '0x' + encodeAssetId(data.syntheticAssetId),
    data.collateralAmount.toString(),
    data.syntheticAmount.toString(),
    data.isABuyingSynthetic,
    data.nonce.toString(),
  ])
}

export function decodeForcedTradeFreezeRequest(
  data: string,
  collateralAsset: CollateralAsset
): ForcedTradeFreezeRequest | undefined {
  try {
    const decoded = forcedTradeFreezeRequestCoder.decodeFunctionData(
      'freezeRequest',
      data
    )
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKeyA: StarkKey.from(decoded.starkKeyA),
      starkKeyB: StarkKey.from(decoded.starkKeyB),
      positionIdA: BigInt(decoded.vaultIdA),
      positionIdB: BigInt(decoded.vaultIdB),
      collateralAssetId: validateCollateralAssetIdByHash(
        decoded.collateralAssetId.toHexString(),
        collateralAsset
      ),
      syntheticAssetId: decodeAssetId(decoded.syntheticAssetId),
      collateralAmount: BigInt(decoded.amountCollateral),
      syntheticAmount: BigInt(decoded.amountSynthetic),
      isABuyingSynthetic: Boolean(decoded.aIsBuyingSynthetic),
      nonce: BigInt(decoded.nonce),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}

export interface FullWithdrawalFreezeRequest {
  starkKey: StarkKey
  vaultId: bigint
}

export function encodeFullWithdrawalFreezeRequest(
  data: FullWithdrawalFreezeRequest
) {
  return fullWithdrawalFreezeRequestCoder.encodeFunctionData('freezeRequest', [
    data.starkKey.toString(),
    data.vaultId.toString(),
  ])
}

export function decodeFullWithdrawalFreezeRequest(data: string) {
  try {
    const decoded = fullWithdrawalFreezeRequestCoder.decodeFunctionData(
      'freezeRequest',
      data
    )
    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKey: StarkKey.from(decoded.ownerKey),
      vaultId: BigInt(decoded.vaultId),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}
