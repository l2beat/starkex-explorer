import { AssetId } from '@explorer/types'

import { Asset } from '../assets'

export function formatAmount(asset: Asset, amount: bigint) {
  if (AssetId.check(asset.hashOrId)) {
    return formatWithDecimals(amount, AssetId.decimals(asset.hashOrId))
  } else if (asset.details) {
    return formatWithQuantum(amount, asset.details.quantum)
  } else {
    return formatWithDecimals(amount, 0)
  }
}

export function formatWithDecimals(amount: bigint, decimals: number): string {
  if (amount < 0n) {
    return '-' + formatWithDecimals(-amount, decimals)
  }
  const one = 10n ** BigInt(decimals)
  const intPart = formatInt(amount / one)
  const fractionPart = formatFraction(amount % one, decimals)
  return `${intPart}${fractionPart}`
}

export function formatInt(int: bigint | number) {
  const groups: string[] = []
  const stringified = int.toString()
  for (let i = 0; i < stringified.length; i += 3) {
    groups.unshift(
      stringified.slice(
        Math.max(stringified.length - i - 3, 0),
        stringified.length - i
      )
    )
  }
  return groups.join()
}

function formatFraction(fraction: bigint, decimals: number): string {
  if (fraction === 0n) {
    return ''
  }
  const fractionPart = fraction
    .toString()
    .padStart(decimals, '0')
    .replace(/0+$/, '')
  return `.${fractionPart}`
}

export function formatWithQuantum(amount: bigint, quantum: bigint): string {
  const decimals = quantumToDecimals(quantum)
  if (decimals) {
    return formatWithDecimals(amount, decimals)
  }
  return formatWithDecimals((amount * 1000n) / quantum, 3)
}

export function quantumToDecimals(quantum: bigint) {
  let decimals = 0
  let current = quantum
  while (current > 1n) {
    current /= 10n
    decimals++
  }
  const recoveredQuantum = 10n ** BigInt(decimals)
  if (recoveredQuantum === quantum) {
    return decimals
  }
  return undefined
}
