import { AssetId } from '@explorer/types'

export function getAssetPriceUSDCents(price: bigint, assetId: AssetId) {
  return getAssetValueUSDCents(10n ** BigInt(AssetId.decimals(assetId)), price)
}

export function getAssetValueUSDCents(balance: bigint, price: bigint) {
  return (balance * price) / 2n ** 32n / 10_000n
}
