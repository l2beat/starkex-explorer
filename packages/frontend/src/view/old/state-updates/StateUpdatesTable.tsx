import React from 'react'

import { Table } from '../common/table'
import { formatHashLong, formatRelativeTime } from '../formatting'
import { StateUpdateEntry } from './StateUpdatesIndexProps'

export interface StateUpdatesTableProps {
  readonly stateUpdates: readonly StateUpdateEntry[]
}

export function StateUpdatesTable({ stateUpdates }: StateUpdatesTableProps) {
  return (
    <Table
      noRowsText="no state updates have occurred so far"
      columns={[
        { header: 'No.' },
        { header: 'Tx Hash', monospace: true, fullWidth: true },
        { header: 'Time' },
        { header: 'Position updates', numeric: true },
        { header: 'Forced txs', numeric: true },
      ]}
      rows={stateUpdates.map((update) => {
        return {
          link: `/state-updates/${update.id}`,
          cells: [
            update.id.toString(),
            formatHashLong(update.hash),
            formatRelativeTime(update.timestamp),
            update.positionCount.toString(),
            update.forcedTransactionsCount.toString(),
          ],
        }
      })}
    />
  )
}
