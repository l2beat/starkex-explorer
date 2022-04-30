import { AssetBalance } from '@explorer/encoding'

export function countUpdatedAssets(
  prev: readonly AssetBalance[],
  current: readonly AssetBalance[]
) {
  return current.reduce((updates, balance) => {
    const prevBalance = prev.find((b) => b.assetId === balance.assetId)
    const updated = !prevBalance || prevBalance.balance !== balance.balance
    return updated ? updates + 1 : updates
  }, 0)
}
