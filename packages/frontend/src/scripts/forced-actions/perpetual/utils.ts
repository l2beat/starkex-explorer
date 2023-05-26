import { CollateralAsset } from '@explorer/shared'
import { AssetId } from '@explorer/types'

import { FormState } from './types'

export function getFormType(
  assetId: AssetId,
  balance: bigint,
  collateralAsset: CollateralAsset
): FormState['type'] {
  if (isSellable(assetId, balance, collateralAsset)) {
    return 'sell'
  }
  if (isBuyable(assetId, balance, collateralAsset)) {
    return 'buy'
  }
  return 'withdraw'
}

function isSellable(
  assetId: AssetId,
  balance: bigint,
  collateralAsset: CollateralAsset
): boolean {
  return assetId !== collateralAsset.assetId && balance > 0n
}

export function isBuyable(
  assetId: AssetId,
  balance: bigint,
  collateralAsset: CollateralAsset
): boolean {
  return assetId !== collateralAsset.assetId && balance < 0n
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
