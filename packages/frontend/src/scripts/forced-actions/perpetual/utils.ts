import { AssetId } from '@explorer/types'

import { PositionAssetEntry } from '../../../view'
import { FormState } from './types'

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

export function getFormType(
  assetId: AssetId,
  balance: bigint
): FormState['type'] {
  if (isSellable(assetId, balance)) {
    return 'sell'
  }
  if (isBuyable(assetId, balance)) {
    return 'buy'
  }
  return 'withdraw'
}

export function isSellable(assetId: AssetId, balance: bigint): boolean {
  return assetId !== AssetId.USDC && balance > 0n
}

export function isBuyable(assetId: AssetId, balance: bigint): boolean {
  return assetId !== AssetId.USDC && balance < 0n
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
