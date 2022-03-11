export function centsToFixedDollars(cents: bigint) {
  const centsString = cents.toString().padEnd(3, '0')
  return centsString.slice(0, -2) + '.' + centsString.slice(-2)
}
