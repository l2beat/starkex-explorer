import { AssetHash } from '@explorer/types'

import { CollateralAsset } from '../CollateralAsset'

export function getCollateralAssetIdFromHash(
  hash: string | AssetHash,
  collateralAsset: CollateralAsset
) {
  if (AssetHash(hash.toString()) !== collateralAsset.assetHash) {
    throw new Error(`Invalid collateral asset hash: ${hash.toString()}`)
  }

  return collateralAsset.assetId
}
