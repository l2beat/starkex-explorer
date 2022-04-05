import { Timestamp } from '@explorer/types'
import { format } from 'timeago.js'

export function formatTime(timestamp: Timestamp) {
  return format(Number(timestamp))
}
