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
      <div className="w-full overflow-x-auto mb-8">
        <table className="whitespace-nowrap w-full">
          {events.map((event, i) => (
            <tr className="bg-grey-200 border-2 border-grey-100" key={i}>
              <th className="font-normal text-left w-[268px] py-2 px-1.5">
                {formatAbsoluteTime(event.timestamp)}
              </th>
              <td className="font-normal first-letter:capitalize py-2 px-1.5">
                {event.text}
              </td>
            </tr>
          ))}
        </table>
      </div>
    </>
  )
}
