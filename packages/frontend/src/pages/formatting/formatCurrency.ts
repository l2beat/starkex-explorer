import { AssetId } from '@explorer/types'

import { formatWithPrecision } from './formatWithPrecision'

export function formatCurrency(
  units: bigint | number,
  currency: AssetId | 'USD'
) {
  const value = formatCurrencyUnits(units, currency)
  if (currency === 'USD') {
    return `$${value}`
  } else {
    return `${value} ${AssetId.symbol(currency)}`
  }
}

export function formatCurrencyUnits(
  units: bigint | number,
  currency: AssetId | 'USD'
) {
  return formatWithPrecision(
    units,
    currency === 'USD' ? 2 : AssetId.decimals(currency)
  )
}
