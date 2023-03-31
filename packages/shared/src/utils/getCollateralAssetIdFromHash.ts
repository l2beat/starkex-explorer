import { AssetHash, Hash256 } from '@explorer/types'

import { CollateralAsset } from '../CollateralAsset'

export function getCollateralAssetIdFromHash(
  hash: AssetHash | Hash256 | string,
  collateralAsset: CollateralAsset
) {
  if (hash.toString() !== collateralAsset.assetHash.toString()) {
    throw new Error(`Invalid collateral asset hash: ${hash.toString()}`)
  }

  return collateralAsset.assetId
}
