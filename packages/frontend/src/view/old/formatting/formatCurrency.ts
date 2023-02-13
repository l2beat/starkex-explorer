import { AssetId } from '@explorer/types'

import { formatApproximation, formatWithPrecision } from './formatNumber'

export function formatCurrency(
  units: bigint | number,
  currency: AssetId | 'USD'
) {
  if (currency === 'USD') {
    if (units < 0) {
      return `-$${formatCurrencyUnits(-units, currency)}`
    }
    return `$${formatCurrencyUnits(units, currency)}`
  } else {
    const value = formatCurrencyUnits(units, currency)
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

export function formatCurrencyApproximation(
  units: bigint | number,
  currency: AssetId,
  precision: number
) {
  const value = formatApproximation(
    units,
    AssetId.decimals(currency),
    precision
  )
  return `${value} ${AssetId.symbol(currency)}`
}
