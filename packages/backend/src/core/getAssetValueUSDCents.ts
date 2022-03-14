export function getAssetValueUSDCents(
  balance: bigint,
  price: bigint
) {
  return balance * price / 2n ** 32n / 10_000n
}
