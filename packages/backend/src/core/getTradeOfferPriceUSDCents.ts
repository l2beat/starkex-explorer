import { AssetId } from '@explorer/types'

export function getTradeOfferPriceUSDCents(
  amountCollateral: bigint,
  syntheticAssetId: AssetId,
  amountSynthetic: bigint
): bigint {
  return (
    (amountCollateral * BigInt(10 ** AssetId.decimals(syntheticAssetId))) /
    amountSynthetic /
    10_000n
  )
}
