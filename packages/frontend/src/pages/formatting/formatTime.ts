import { Timestamp } from '@explorer/types'
import { format } from 'timeago.js'

export function formatRelativeTime(timestamp: Timestamp) {
  return format(Number(timestamp))
}

export function formatAbsoluteTime(timestamp: Timestamp) {
  const iso = new Date(Number(timestamp)).toISOString()
  const relative = formatRelativeTime(timestamp)
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC (${relative})`
}
