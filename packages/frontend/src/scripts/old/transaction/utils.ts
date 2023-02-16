import { AssetId } from '@explorer/types'

import { PositionAssetEntry } from '../../../view'


export function getAsset(
  selected: AssetId,
  assets: readonly PositionAssetEntry[]
) {
  let asset = assets.find((x) => x.assetId === selected)
  if (!asset) {
    console.error('Nonexistent asset selected')
    asset = assets[0]
    if (!asset) {
      throw new Error('Programmer error: No assets')
    }
  }
  return asset
}

export function isSellable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance > 0n
}

export function isBuyable(x: PositionAssetEntry): boolean {
  return x.assetId !== AssetId.USDC && x.balance < 0n
}

export function formatCurrencyInput(value: bigint, assetId: AssetId): string {
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

export function parseCurrencyInput(
  value: string,
  assetId: AssetId
): bigint | undefined {
  if (value === '') {
    return 0n
  }
  const INPUT_RE = /^\d+\.?\d*$/
  if (INPUT_RE.test(value)) {
    const decimals = AssetId.decimals(assetId)
    const [integer, fraction] = value.split('.')
    if (!fraction || fraction.length <= decimals) {
      return (
        BigInt(integer ?? 0) * 10n ** BigInt(decimals) +
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        BigInt((fraction ?? '').padEnd(decimals, '0'))
      )
    }
  }
  return undefined
}
