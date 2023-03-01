import { AssetBalance } from '@explorer/encoding'
import { PositionAssetEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

export function toPositionAssetEntries(
  balances: readonly AssetBalance[],
  collateralBalance: bigint,
  prices: { price: bigint; assetId: AssetId }[]
): PositionAssetEntry[] {
  return balances
    .map(({ balance, assetId }): PositionAssetEntry => {
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
    .concat({
      assetId: AssetId.USDC,
      balance: collateralBalance,
      totalUSDCents: collateralBalance / 10_000n,
      priceUSDCents: 100n,
    })
    .filter((x) => x.balance !== 0n)
    .sort(
      (a, b) =>
        Math.abs(Number(b.totalUSDCents)) - Math.abs(Number(a.totalUSDCents))
    )
}

export function getAssetPriceUSDCents(price: bigint, assetId: AssetId) {
  return getAssetValueUSDCents(10n ** BigInt(AssetId.decimals(assetId)), price)
}

export function getAssetValueUSDCents(balance: bigint, price: bigint) {
  return (balance * price) / 2n ** 32n / 10_000n
}
