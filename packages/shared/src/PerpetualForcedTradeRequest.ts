import { Interface } from '@ethersproject/abi'
import { decodeAssetId, encodeAssetId } from '@explorer/encoding'
import { AssetId, StarkKey, Timestamp } from '@explorer/types'

import { CollateralAsset } from './CollateralAsset'
import { validateCollateralAssetIdByHash } from './utils'

const coder = new Interface([
  `function forcedTradeRequest(
      uint256 starkKeyA,
      uint256 starkKeyB,
      uint256 positionIdA,
      uint256 positionIdB,
      uint256 collateralAssetId,
      uint256 syntheticAssetId,
      uint256 collateralAmount,
      uint256 syntheticAmount,
      bool isABuyingSynthetic,
      uint256 submissionExpirationTime,
      uint256 nonce,
      bytes calldata signature,
      bool premiumCost
    )`,
])

export interface PerpetualForcedTradeRequest {
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
  signature: string
  premiumCost: boolean
}

export function decodePerpetualForcedTradeRequest(
  data: string,
  collateralAsset: CollateralAsset
): PerpetualForcedTradeRequest | undefined {
  try {
    const decoded = coder.decodeFunctionData('forcedTradeRequest', data)

    /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
    return {
      starkKeyA: StarkKey.from(decoded.starkKeyA),
      starkKeyB: StarkKey.from(decoded.starkKeyB),
      positionIdA: BigInt(decoded.positionIdA),
      positionIdB: BigInt(decoded.positionIdB),
      collateralAssetId: validateCollateralAssetIdByHash(
        decoded.collateralAssetId.toHexString(),
        collateralAsset
      ),
      syntheticAssetId: decodeAssetId(decoded.syntheticAssetId),
      collateralAmount: BigInt(decoded.collateralAmount),
      syntheticAmount: BigInt(decoded.syntheticAmount),
      isABuyingSynthetic: Boolean(decoded.isABuyingSynthetic),
      submissionExpirationTime: Timestamp.fromHours(
        decoded.submissionExpirationTime
      ),
      nonce: BigInt(decoded.nonce),
      signature: String(decoded.signature),
      premiumCost: Boolean(decoded.premiumCost),
    }
    /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call  */
  } catch {
    return
  }
}

export function encodePerpetualForcedTradeRequest(
  data: Omit<PerpetualForcedTradeRequest, 'collateralAssetId'>,
  collateralAsset: CollateralAsset
) {
  return coder.encodeFunctionData('forcedTradeRequest', [
    data.starkKeyA,
    data.starkKeyB,
    data.positionIdA,
    data.positionIdB,
    collateralAsset.assetHash,
    '0x' + encodeAssetId(data.syntheticAssetId),
    data.collateralAmount,
    data.syntheticAmount,
    data.isABuyingSynthetic,
    Timestamp.toHours(data.submissionExpirationTime),
    data.nonce,
    data.signature,
    data.premiumCost,
  ])
}
