import { Timestamp } from '@explorer/types'
import React from 'react'

import { formatTimestampParts } from '../../utils/formatting/formatTimestamp'

interface TimeCellProps {
  timestamp: Timestamp
}

export function TimeCell({ timestamp }: TimeCellProps) {
  const { datePart, timePart } = formatTimestampParts(timestamp, 'local')

  return (
    <div className="relative top-0.5 flex flex-col sm:top-0 sm:flex-row sm:gap-1">
      <span className="text-xs sm:text-sm">{datePart}</span>
      <span className="text-xxs text-zinc-500 sm:text-sm sm:text-white">
        {timePart}
      </span>
    </div>
  )
}
