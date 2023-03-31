import { AssetHash, AssetId } from '@explorer/types'

export interface CollateralAsset {
  assetId: AssetId
  assetHash: AssetHash
  price: bigint
}
