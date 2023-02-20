import { Timestamp } from '@explorer/types'
import React from 'react'

export type StatusType = 'BEGIN' | 'MIDDLE' | 'END' | 'ERROR' | 'CANCEL'

export interface TimeCellProps {
  timestamp: Timestamp
}

export function TimeCell({ timestamp }: TimeCellProps) {
  const date = new Date(Number(timestamp))

  // we are using local time, not UTC time!
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')

  const datePart = `${year}-${month}-${day}`
  const timePart = `${hour}:${minute}:${second}`
  return (
    <div className="relative top-0.5 flex flex-col sm:top-0 sm:flex-row sm:gap-1">
      <span className="text-xs sm:text-sm">{datePart}</span>
      <span className="text-xxs text-zinc-500 sm:text-sm sm:text-white">
        {timePart}
      </span>
    </div>
  )
}

export function formatTimestamp(timestamp: Timestamp): string {
  const date = new Date(Number(timestamp))
  const iso = date.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 19)}`
}
