import React from 'react'

import { ClientPaginatedTable } from '../common/table'
import { formatCurrency } from '../formatting'
import { PositionHistoryEntry } from './PositionDetailsProps'

export interface PositionHistoryTableProps {
  readonly history: readonly PositionHistoryEntry[]
  readonly positionId: bigint
}

export function PositionHistoryTable(props: PositionHistoryTableProps) {
  return (
    <ClientPaginatedTable
      id="position-history"
      noRowsText="this position has no update history"
      columns={updateHistoryTableColumns}
      rows={props.history.map(buildUpdateHistoryTableRow(props.positionId))}
    />
  )
}

const updateHistoryTableColumns = [
  { header: 'State update' },
  { header: 'Value before', numeric: true },
  { header: 'Value after', numeric: true },
  { header: 'Asset updates', numeric: true },
]

const buildUpdateHistoryTableRow =
  (positionId: bigint) =>
  (
    { stateUpdateId, totalUSDCents, assetsUpdated }: PositionHistoryEntry,
    i: number,
    history: readonly PositionHistoryEntry[]
  ) => {
    const previousTotal = history[i + 1]?.totalUSDCents
    const valueBefore = previousTotal
      ? `${formatCurrency(previousTotal, 'USD')}`
      : `${formatCurrency(0, 'USD')}`

    return {
      link: `/positions/${positionId}/updates/${stateUpdateId}`,
      cells: [
        stateUpdateId.toString(),
        valueBefore,
        formatCurrency(totalUSDCents, 'USD'),
        assetsUpdated.toString(),
      ],
    }
  }
