import { Timestamp } from '@explorer/types'
import React from 'react'

import { formatAbsoluteTime } from '../formatting'
import { SectionHeading } from './header/SectionHeading'

export interface ForcedHistoryEvent {
  timestamp: Timestamp
  text: string
}

export interface ForcedHistoryProps {
  events: ForcedHistoryEvent[]
}

export function ForcedHistory({ events }: ForcedHistoryProps) {
  return (
    <>
      <SectionHeading>History</SectionHeading>
      <div className="mb-8 w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          {events.map((event, i) => (
            <tr className="border-gray-100 bg-gray-200 border-2" key={i}>
              <th className="w-[268px] py-2 px-1.5 text-left font-normal">
                {formatAbsoluteTime(event.timestamp)}
              </th>
              <td className="py-2 px-1.5 font-normal first-letter:capitalize">
                {event.text}
              </td>
            </tr>
          ))}
        </table>
      </div>
    </>
  )
}
