import { Timestamp } from '@explorer/types'

// Right now we treat every timestamp as UTC because we are using SSR and there is currently no way to get the user's timezone
// If we ever add a way to get the user's timezone, we can add a 'local' type and retrieve the timezone from the headers or smth

export function formatTimestamp(timestamp: Timestamp) {
  const { datePart, timePart } = formatTimestampParts(timestamp)
  return `${datePart} ${timePart}`
}

export function formatTimestampParts(timestamp: Timestamp) {
  const date = new Date(Number(timestamp))

  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours()
  const minute = date.getUTCMinutes()
  const second = date.getUTCSeconds()

  const YYYY = year.toString().padStart(4, '0')
  const MM = month.toString().padStart(2, '0')
  const DD = day.toString().padStart(2, '0')

  const hh = hour.toString().padStart(2, '0')
  const mm = minute.toString().padStart(2, '0')
  const ss = second.toString().padStart(2, '0')

  return {
    datePart: `${YYYY}-${MM}-${DD}`,
    timePart: `${hh}:${mm}:${ss}`,
  }
}
