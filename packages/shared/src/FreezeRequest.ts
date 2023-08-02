import { Interface } from '@ethersproject/abi'
import { encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey } from '@explorer/types'

import { CollateralAsset } from './CollateralAsset'
import { validateCollateralAssetHashById } from './utils'

const forcedWithdrawalFreezeRequestCoder = new Interface([
  'function freezeRequest(uint256,uint256,uint256)',
])
const forcedTradeFreezeRequestCoder = new Interface([
  'function freezeRequest(uint256 starkKeyA, uint256 starkKeyB, uint256 vaultIdA, uint256 vaultIdB, uint256 collateralAssetId, uint256 syntheticAssetId, uint256 amountCollateral, uint256 amountSynthetic, bool aIsBuyingSynthetic, uint256 nonce)',
])

export interface ForcedWithdrawalFreezeRequest {
  starkKey: StarkKey
  positionOrVaultId: bigint
  quantizedAmount: bigint
}

export function encodeForcedWithdrawalFreezeRequest(
  data: ForcedWithdrawalFreezeRequest
) {
  return forcedWithdrawalFreezeRequestCoder.encodeFunctionData(
    'freezeRequest',
    [
      data.starkKey,
      data.positionOrVaultId.toString(),
      data.quantizedAmount.toString(),
    ]
  )
}

export interface ForcedTradeFreezeRequest {
  starkKeyA: StarkKey
  starkKeyB: StarkKey
  vaultIdA: bigint
  vaultIdB: bigint
  collateralAssetId: AssetId
  syntheticAssetId: AssetId
  amountCollateral: bigint
  amountSynthetic: bigint
  aIsBuyingSynthetic: boolean
  nonce: bigint
}

export function encodeForcedTradeFreezeRequest(
  data: ForcedTradeFreezeRequest,
  collateralAsset: CollateralAsset
) {
  return forcedTradeFreezeRequestCoder.encodeFunctionData('freezeRequest', [
    data.starkKeyA.toString(),
    data.starkKeyB.toString(),
    data.vaultIdA.toString(),
    data.vaultIdB.toString(),
    // TODO: Use this in other files
    validateCollateralAssetHashById(data.collateralAssetId, collateralAsset),
    '0x' + encodeAssetId(data.syntheticAssetId),
    data.amountCollateral.toString(),
    data.amountSynthetic.toString(),
    data.aIsBuyingSynthetic,
    data.nonce.toString(),
  ])
}
