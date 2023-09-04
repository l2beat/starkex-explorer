import { Timestamp } from '@explorer/types'

export function calculateAge(timestamp: Timestamp) {
  const now = BigInt(new Date().getTime())
  const age = now - timestamp.valueOf()
  const seconds = age / 1000n
  const minutes = seconds / 60n
  const hours = minutes / 60n
  const days = hours / 24n

  if (seconds < 10n) {
    return 'Just now'
  }

  if (seconds < 60n && minutes === 0n && hours === 0n && days === 0n) {
    return `${seconds} ${addPluralConditionally('sec', seconds)}`
  }

  if (minutes < 60 && hours === 0n && days === 0n) {
    return `${minutes} ${addPluralConditionally('min', minutes)}`
  }

  if (hours < 24 && days === 0n) {
    return `${hours} ${addPluralConditionally('hour', hours)}`
  }

  return `${days} ${addPluralConditionally('day', days)}`
}

function addPluralConditionally(val: string, n: bigint): string {
  return n === 1n ? val : `${val}s`
}
