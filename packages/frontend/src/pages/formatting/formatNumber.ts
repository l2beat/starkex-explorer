export function formatWithPrecision(
  units: bigint | number,
  precision: number
): string {
  if (units < 0) {
    return '-' + formatWithPrecision(-units, precision)
  }
  const base = BigInt(units)
    .toString()
    .padStart(precision + 1, '0')
  const integerPart = base.slice(0, base.length - precision)
  const fractionPart = precision !== 0 ? '.' + base.slice(-precision) : ''
  return formatThousands(integerPart) + fractionPart
}

function formatThousands(integer: string) {
  for (let i = integer.length - 3; i > 0; i -= 3) {
    integer = integer.slice(0, i) + ',' + integer.slice(i)
  }
  return integer
}

export function formatApproximation(
  units: bigint | number,
  decimals: number,
  precision: number
): string {
  if (units < 0) {
    return '-' + formatApproximation(-units, decimals, precision)
  }
  const base = BigInt(units).toString()
  const approximation = BigInt(
    base.slice(0, base.length - (decimals - precision))
  )
  return formatWithPrecision(approximation, precision)
}
