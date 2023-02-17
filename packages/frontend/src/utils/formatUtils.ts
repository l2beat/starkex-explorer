import {
  AssetHash,
  AssetId,
  Hash256,
  PedersenHash,
  StarkKey,
} from '@explorer/types'

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

export function formatHashLong(
  hash: PedersenHash | StarkKey | Hash256 | AssetHash | string
) {
  const digits = hash.startsWith('0x') ? hash.slice(2) : hash.toString()
  return '0x' + digits.toUpperCase()
}

export function formatHashShort(
  hash: PedersenHash | StarkKey | Hash256 | AssetHash | string
) {
  const longHash = formatHashLong(hash)
  return `${longHash.slice(0, 10)}…${longHash.slice(-8)}`
}
