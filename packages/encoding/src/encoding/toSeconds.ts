import { Timestamp } from '@explorer/types'

export function toSeconds(timestamp: Timestamp) {
  return Math.floor(+timestamp / 1000)
}
