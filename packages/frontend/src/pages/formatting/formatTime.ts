import { Timestamp } from '@explorer/types'
import { format } from 'timeago.js'

export function formatTime(timestamp: Timestamp) {
  return format(Number(timestamp))
}

export function formatTimestamp(timestamp: Timestamp) {
  const date = new Date(Number(timestamp))
  const day = date.getUTCDate()
  const month = date.getUTCMonth()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const timeAgo = formatTime(timestamp)
  return `${year}-${month}-${day} ${hours}:${minutes} UTC (${timeAgo})`
}
