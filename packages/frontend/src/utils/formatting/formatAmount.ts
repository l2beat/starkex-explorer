import { AssetId } from '@explorer/types'

import { Asset } from '../assets'

export function formatAmount(asset: Asset, amount: bigint, prefix?: string) {
  if (AssetId.check(asset.hashOrId)) {
    return formatWithDecimals(amount, AssetId.decimals(asset.hashOrId), prefix)
  } else if (asset.details) {
    return formatWithQuantum(amount, asset.details.quantum, prefix)
  } else {
    return formatWithDecimals(amount, 0, prefix)
  }
}

export function formatWithDecimals(
  amount: bigint,
  decimals: number,
  prefix = ''
): string {
  if (amount < 0n) {
    return '-' + formatWithDecimals(-amount, decimals, prefix)
  }
  const one = 10n ** BigInt(decimals)
  const intPart = formatInt(amount / one)
  const fractionPart = formatFraction(amount % one, decimals)
  return `${prefix}${intPart}${fractionPart}`
}

export function formatInt(int: bigint | number) {
  let str = int.toString()
  for (let i = str.length - 3; i > 0; i -= 3) {
    str = str.slice(0, i) + ',' + str.slice(i)
  }
  return str
}

function formatFraction(fraction: bigint, decimals: number): string {
  if (fraction === 0n) return ''
  return '.' + fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
}

export function formatWithQuantum(
  amount: bigint,
  quantum: bigint,
  prefix?: string
): string {
  const decimals = quantumToDecimals(quantum)
  if (decimals) {
    return formatWithDecimals(amount, decimals, prefix)
  }
  return formatWithDecimals((amount * 1000n) / quantum, 3, prefix)
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
