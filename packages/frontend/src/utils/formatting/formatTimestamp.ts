import { Timestamp } from '@explorer/types'

export function formatTimestamp(timestamp: Timestamp, type: 'local' | 'utc') {
  const { datePart, timePart } = formatTimestampParts(timestamp, type)
  return `${datePart} ${timePart}`
}

export function formatTimestampParts(
  timestamp: Timestamp,
  type: 'local' | 'utc'
) {
  const date = new Date(Number(timestamp))

  const year = type === 'local' ? date.getFullYear() : date.getUTCFullYear()
  const month = type === 'local' ? date.getMonth() + 1 : date.getUTCMonth() + 1
  const day = type === 'local' ? date.getDate() : date.getUTCDate()
  const hour = type === 'local' ? date.getHours() : date.getUTCHours()
  const minute = type === 'local' ? date.getMinutes() : date.getUTCMinutes()
  const second = type === 'local' ? date.getSeconds() : date.getUTCSeconds()

  const YYYY = year.toString().padStart(4, '0')
  const MM = month.toString().padStart(2, '0')
  const DD = day.toString().padStart(2, '0')

  const hh = hour.toString().padStart(2, '0')
  const mm = minute.toString().padStart(2, '0')
  const ss = second.toString().padStart(2, '0')

  return { datePart: `${YYYY}-${MM}-${DD}`, timePart: `${hh}:${mm}:${ss}` }
}
