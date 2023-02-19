import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { formatInt } from '../../../utils/formatting/formatAmount'
import { formatTimestamp } from '../../../utils/formatting/formatTimestamp'
import { Table } from '../common/table/Table'

export interface HomeStateUpdateEntry {
  timestamp: Timestamp
  id: string
  hash: Hash256
  updateCount: number
  forcedTransactionCount: number
}

export interface HomeStateUpdatesTableProps {
  stateUpdates: HomeStateUpdateEntry[]
}

export function HomeStateUpdatesTable(props: HomeStateUpdatesTableProps) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Id' },
        { header: 'Hash' },
        { header: 'Updates', numeric: true },
        { header: 'Forced txs', numeric: true },
      ]}
      rows={props.stateUpdates.map((stateUpdate) => {
        return {
          link: `/state-updates/${stateUpdate.id}`,
          cells: [
            formatTimestamp(stateUpdate.timestamp),
            <span className="text-blue-600 underline">#{stateUpdate.id}</span>,
            <span className="block max-w-[300px] truncate">
              {stateUpdate.hash}
            </span>,
            stateUpdate.updateCount > 0
              ? formatInt(stateUpdate.updateCount)
              : '-',
            stateUpdate.forcedTransactionCount > 0
              ? formatInt(stateUpdate.forcedTransactionCount)
              : '-',
          ],
        }
      })}
    />
  )
}
