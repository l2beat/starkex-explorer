import { AssetId } from '@explorer/types'

export function formatCurrencyInput(
  value: bigint | undefined,
  assetId: AssetId
): string {
  if (value !== undefined) {
    if (value < 0) {
      return formatCurrencyInput(-value, assetId)
    }
    const decimals = AssetId.decimals(assetId)
    const base = value.toString().padStart(decimals + 1, '0')
    const integerPart = base.slice(0, base.length - decimals)
    let fractionPart = decimals !== 0 ? '.' + base.slice(-decimals) : ''
    while (fractionPart.endsWith('0') || fractionPart === '.') {
      fractionPart = fractionPart.slice(0, -1)
    }
    return integerPart + fractionPart
  }
  return '0.00'
}
