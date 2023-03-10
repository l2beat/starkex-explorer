import { Timestamp } from '@explorer/types'
import React from 'react'

import { SectionHeading } from '../../../components/SectionHeading'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

interface TransactionHistoryTableProps {
  entries: TransactionHistoryEntry[]
}

export interface TransactionHistoryEntry {
  timestamp: Timestamp | undefined
  statusType: StatusType
  statusText: string
  description: React.ReactNode
}

export function TransactionHistoryTable(props: TransactionHistoryTableProps) {
  return (
    <section>
      <SectionHeading title="History" />
      <Table
        columns={[
          { header: 'Time' },
          { header: 'Status' },
          { header: 'Description' },
        ]}
        rows={props.entries.map((entry) => {
          return {
            cells: [
              entry.timestamp ? (
                <TimeCell timestamp={entry.timestamp} />
              ) : (
                'Unknown'
              ),
              <StatusBadge type={entry.statusType}>
                {entry.statusText}
              </StatusBadge>,
              entry.description,
            ],
          }
        })}
      />
    </section>
  )
}
