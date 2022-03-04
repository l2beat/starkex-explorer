import { AssetId } from '@explorer/types'

export function getAssetValueUSDCents(
  balance: bigint,
  price: bigint,
  assetId: AssetId
) {
  return (
    (balance * price * 10n ** BigInt(AssetId.decimals(assetId))) /
    2n ** 32n /
    1000n
  )
}
