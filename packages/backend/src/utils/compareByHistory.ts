import { Timestamp } from '@explorer/types'

export function compareByHistory<
  T extends { history: { timestamp: Timestamp }[] }
>(a: T, b: T) {
  const maxComparisons = Math.max(a.history.length, b.history.length)
  for (let i = 0; i < maxComparisons; i++) {
    const aTimestamp = a.history.at(-1 - i)?.timestamp ?? Infinity
    const bTimestamp = b.history.at(-1 - i)?.timestamp ?? Infinity
    const diff = Number(aTimestamp) - Number(bTimestamp)
    if (diff !== 0) {
      return diff < 0 ? -1 : 1
    }
  }
  return 0
}
