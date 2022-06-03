import { AssetId } from '@explorer/types'

export function getTradeOfferPriceUSDCents(
  collateralAmount: bigint,
  syntheticAssetId: AssetId,
  syntheticAmount: bigint
): bigint {
  return (
    (collateralAmount * BigInt(10 ** AssetId.decimals(syntheticAssetId))) /
    syntheticAmount /
    10_000n
  )
}
