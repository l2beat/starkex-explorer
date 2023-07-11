import { CollateralAsset } from '@explorer/shared'
import { AssetHash, AssetId } from '@explorer/types'

export const fakeCollateralAsset: CollateralAsset = {
  assetId: AssetId('USDC-6'),
  assetHash: AssetHash.fake(),
  price: 1_000_000n,
}
