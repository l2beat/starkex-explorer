import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { formatInt } from '../../../../utils/formatting/formatAmount'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'
import { Table } from '../../../components/table/Table'
import { TimeAgeCell } from '../../../components/TimeAgeCell'

export interface HomeStateUpdateEntry {
  timestamp: Timestamp
  id: string
  hash: Hash256
  updateCount: number
  forcedTransactionCount: number
}

interface HomeStateUpdatesTableProps {
  stateUpdates: HomeStateUpdateEntry[]
}

export function HomeStateUpdatesTable(props: HomeStateUpdatesTableProps) {
  return (
    <Table
      hideAfter={19}
      columns={[
        { header: 'Id' },
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
        { header: 'Tx Hash' },
        { header: 'Age' },
      ]}
      rows={props.stateUpdates.map((stateUpdate) => {
        return {
          link: `/state-updates/${stateUpdate.id}`,
          cells: [
            <Link>#{stateUpdate.id}</Link>,
            stateUpdate.updateCount > 0
              ? formatInt(stateUpdate.updateCount)
              : '-',
            stateUpdate.forcedTransactionCount > 0
              ? formatInt(stateUpdate.forcedTransactionCount)
              : '-',
            <InlineEllipsis className="max-w-[80px]">
              {stateUpdate.hash.toString()}
            </InlineEllipsis>,
            <TimeAgeCell timestamp={stateUpdate.timestamp} />,
          ],
        }
      })}
    />
  )
}
