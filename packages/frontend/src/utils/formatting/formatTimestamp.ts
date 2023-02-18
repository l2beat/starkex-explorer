import { Timestamp } from '@explorer/types'

export function formatTimestamp(timestamp: Timestamp): string {
  const date = new Date(Number(timestamp))
  const iso = date.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`
}
