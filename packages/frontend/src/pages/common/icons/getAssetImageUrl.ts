import { AssetId } from '@explorer/types'

export function getAssetImageUrl(assetId: AssetId) {
  if (assetId === AssetId.USDC) {
    return '/images/usdc.svg'
  }
  const symbol = AssetId.symbol(assetId).toLowerCase()
  return `https://dydx.exchange/currencies/${symbol.toLowerCase()}.svg`
}
