import React from 'react'

import { StatusBadge } from '../../components/StatusBadge'
import { Table } from '../../components/table/Table'
import { TablePreview } from '../../components/table/TablePreview'
import { TimeCell } from '../../components/TimeCell'
import { toStatusType } from '../user/components/UserTransactionsTable'
import { HistoryItem } from './common'

interface HistoryTableProps {
  data: HistoryItem[]
}

export function HistoryTable(props: HistoryTableProps) {
  return (
    <TablePreview
      title="History"
      entryShortNamePlural="History items"
      entryLongNamePlural="items"
      total={props.data.length}
      visible={props.data.length}
      link=""
    >
      <Table
        columns={[
          { header: 'Time' },
          { header: 'Status' },
          { header: 'Description' },
        ]}
        rows={props.data.map((item) => {
          return {
            cells: [
              <TimeCell timestamp={item.timestamp} />,
              <StatusBadge
                type={toStatusType(item.status)}
                children={item.status}
              />,
              item.description,
            ],
          }
        })}
      />
    </TablePreview>
  )
}
