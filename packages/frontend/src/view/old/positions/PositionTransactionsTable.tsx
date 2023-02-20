import React from 'react'

import { ClientPaginatedTable, Column, Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { ForcedTransactionEntry } from '../forced-transactions'
import {
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'

export interface PositionTransactionsTableProps {
  readonly transactions: readonly ForcedTransactionEntry[]
  readonly paginated?: boolean
}

export function PositionTransactionsTable(
  props: PositionTransactionsTableProps
) {
  const noRowsText =
    'there are no forced transactions associated with this position'
  const rows = props.transactions.map(buildTransactionHistoryTableRow)
  if (props.paginated) {
    return (
      <ClientPaginatedTable
        id="position-transactions"
        noRowsText={noRowsText}
        columns={transactionHistoryTableColumns}
        rows={rows}
      />
    )
  } else {
    return (
      <Table
        noRowsText={noRowsText}
        columns={transactionHistoryTableColumns}
        rows={rows}
      />
    )
  }
}

const transactionHistoryTableColumns: Column[] = [
  { header: 'Type' },
  { header: 'Time' },
  { header: 'Status' },
  { header: 'Hash', monospace: true, fullWidth: true },
  { header: 'Amount', numeric: true },
  { header: 'Asset' },
]

const buildTransactionHistoryTableRow = (
  transaction: ForcedTransactionEntry
) => {
  return {
    link: `/forced/${transaction.hash.toString()}`,
    cells: [
      transaction.type,
      formatRelativeTime(transaction.lastUpdate),
      transaction.status,
      formatHashLong(transaction.hash),
      formatCurrencyUnits(transaction.amount, transaction.assetId),
      <AssetCell assetId={transaction.assetId} />,
    ],
  }
}
