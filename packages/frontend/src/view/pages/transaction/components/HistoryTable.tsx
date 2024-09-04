import { Timestamp } from '@explorer/types'
import React from 'react'

import { SectionHeading } from '../../../components/SectionHeading'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'
import { TimeAgeCell } from '../../../components/TimeAgeCell'

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
          { header: 'Age' },
          { header: 'Status' },
          { header: 'Description' },
        ]}
        rows={props.entries.map((entry) => {
          return {
            cells: [
              entry.timestamp ? (
                <TimeAgeCell timestamp={entry.timestamp} />
              ) : (
                // This may be unknown if i.e. forced trade offer was not initiated using our explorer.
                // We know that the offer was created, but we don't know when.
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
