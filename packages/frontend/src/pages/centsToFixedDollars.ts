export function centsToFixedDollars(cents: bigint) {
  const centsString = cents.toString().padEnd(3, '0')
  const sign = cents < 0 ? '-' : ''
  return sign + '$' + centsString.replace(/-/, '').slice(0, -2) + '.' + centsString.slice(-2)
}
