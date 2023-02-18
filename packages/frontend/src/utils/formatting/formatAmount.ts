import { AssetId } from '@explorer/types'

import { Asset } from '../assets'

export interface FormatOptions {
  prefix?: string
  suffix?: string
  signed?: boolean
}

export function formatAmount(
  asset: Asset,
  amount: bigint,
  options?: FormatOptions
) {
  if (AssetId.check(asset.hashOrId)) {
    return formatWithDecimals(amount, AssetId.decimals(asset.hashOrId), options)
  } else if (asset.details) {
    return formatWithQuantum(amount, asset.details.quantum, options)
  } else {
    return formatWithDecimals(amount, 0, options)
  }
}

export function formatWithDecimals(
  amount: bigint,
  decimals: number,
  options?: FormatOptions
): string {
  if (amount < 0n) {
    return (
      '-' + formatWithDecimals(-amount, decimals, { ...options, signed: false })
    )
  }
  const one = 10n ** BigInt(decimals)
  const intPart = formatInt(amount / one)
  const fractionPart = formatFraction(amount % one, decimals)

  const core = `${intPart}${fractionPart}`
  const sign = options?.signed && amount > 0n ? '+' : ''
  return `${options?.prefix ?? ''}${sign}${core}${options?.suffix ?? ''}`
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
  options?: FormatOptions
): string {
  const decimals = quantumToDecimals(quantum)
  if (decimals) {
    return formatWithDecimals(amount, decimals, options)
  }
  return formatWithDecimals((amount * 1000n) / quantum, 3, options)
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
