import { AssetBalance } from '@explorer/encoding'
import { AssetId } from '@explorer/types'

import { getAssetPriceUSDCents } from '../../../core/getAssetPriceUSDCents'
import { getAssetValueUSDCents } from '../../../core/getAssetValueUSDCents'

export interface PricedPositionAsset {
  assetId: AssetId
  balance: bigint
  totalUSDCents: bigint
  priceUSDCents: bigint
}

export function applyAssetPrices(
  balances: readonly AssetBalance[],
  collateralBalance: bigint,
  prices: { price: bigint; assetId: AssetId }[]
): PricedPositionAsset[] {
  const assets = balances.map(({ balance, assetId }) => {
    const price = prices.find((p) => p.assetId === assetId)?.price
    const totalUSDCents = price ? getAssetValueUSDCents(balance, price) : 0n
    const priceUSDCents = price ? getAssetPriceUSDCents(price, assetId) : 0n
    return {
      assetId,
      balance,
      priceUSDCents,
      totalUSDCents,
    }
  })
  assets.push({
    assetId: AssetId.USDC,
    balance: collateralBalance,
    totalUSDCents: collateralBalance / 1000n,
    priceUSDCents: 1n,
  })
  return assets
}
