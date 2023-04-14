import { AssetHash, AssetId } from '@explorer/types'
import { z } from 'zod'

import { toJsonWithoutBigInts } from './serialize'
import { stringAs, stringAsBigInt } from './types'

export type CollateralAsset = z.infer<typeof CollateralAsset>
export const CollateralAsset = z.object({
  assetId: stringAs(AssetId),
  assetHash: stringAs(AssetHash),
  price: stringAsBigInt(),
})

export function serializeCollateralAsset(data: CollateralAsset) {
  return toJsonWithoutBigInts(data)
}

export function deserializeCollateralAsset(text: string): CollateralAsset {
  return CollateralAsset.parse(JSON.parse(text))
}
