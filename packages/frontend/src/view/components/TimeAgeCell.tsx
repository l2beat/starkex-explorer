import { Timestamp } from '@explorer/types'
import React from 'react'

import { calculateAge } from '../../utils/calculateAge'

interface TimeCellProps {
  timestamp: Timestamp
}

export function TimeAgeCell({ timestamp }: TimeCellProps) {
  const age = calculateAge(timestamp)

  return <div className="text-xs sm:text-sm">{age}</div>
}
