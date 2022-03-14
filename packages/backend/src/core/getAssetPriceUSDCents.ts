import { AssetId } from '@explorer/types'

import { getAssetValueUSDCents } from './getAssetValueUSDCents'

export function getAssetPriceUSDCents(price: bigint, assetId: AssetId) {
  return getAssetValueUSDCents(10n ** BigInt(AssetId.decimals(assetId)), price)
}
