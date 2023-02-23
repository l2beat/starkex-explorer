import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { formatInt } from '../../../../utils/formatting/formatAmount'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

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
        {
          header: (
            <>
              <span className="hidden sm:inline">Forced txs</span>
              <span className="sm:hidden">Txs</span>
            </>
          ),
          numeric: true,
        },
      ]}
      rows={props.stateUpdates.map((stateUpdate) => {
        return {
          link: `/state-updates/${stateUpdate.id}`,
          cells: [
            <TimeCell timestamp={stateUpdate.timestamp} />,
            <span className="text-blue-600 underline">#{stateUpdate.id}</span>,
            <InlineEllipsis className="max-w-[80px] sm:max-w-[160px]">
              {stateUpdate.hash.toString()}
            </InlineEllipsis>,
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
