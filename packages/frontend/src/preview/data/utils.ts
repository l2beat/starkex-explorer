import { Timestamp } from '@explorer/types'
import range from 'lodash/range'

export function repeat<T>(n: number, create: () => T) {
  return range(n).map(create)
}

export function randomTimestamp(): Timestamp {
  const offset = Math.floor(Math.random() * 3 * 365 * 24 * 60 * 60 * 1000)
  return Timestamp(Date.now() - offset)
}

export function randomFutureTimestamp(): Timestamp {
  const offset = Math.floor(Math.random() * 10 * 24 * 60 * 60 * 1000)
  return Timestamp(Date.now() + offset)
}

export function randomId(): string {
  return Math.floor(Math.random() * 12_000 + 1).toString()
}

export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}
