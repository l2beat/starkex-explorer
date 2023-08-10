import { AssetHash, AssetId } from '@explorer/types'

import { CollateralAsset } from '../CollateralAsset'

export function validateCollateralAssetIdByHash(
  hash: string | AssetHash,
  collateralAsset: CollateralAsset
) {
  if (AssetHash(hash.toString()) !== collateralAsset.assetHash) {
    throw new Error(`Invalid collateral asset hash: ${hash.toString()}`)
  }

  return collateralAsset.assetId
}

export function validateCollateralAssetHashById(
  id: string | AssetId,
  collateralAsset: CollateralAsset
) {
  if (AssetId(id.toString()) !== collateralAsset.assetId) {
    throw new Error(`Invalid collateral asset id: ${id.toString()}`)
  }

  return collateralAsset.assetHash
}
