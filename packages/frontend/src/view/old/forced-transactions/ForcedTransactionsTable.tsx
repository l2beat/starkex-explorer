import React from 'react'

import { Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import {
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
import { ForcedTransactionEntry } from './ForcedTransactionsIndexProps'

export interface ForcedTransactionsTableProps {
  readonly transactions: readonly ForcedTransactionEntry[]
}

export function ForcedTransactionsTable({
  transactions,
}: ForcedTransactionsTableProps) {
  return (
    <Table
      noRowsText="no forced transactions have been issued so far"
      columns={[
        { header: 'Type' },
        { header: 'Time' },
        { header: 'Status' },
        { header: 'Hash', monospace: true, fullWidth: true },
        { header: 'Position' },
        { header: 'Amount', numeric: true },
        { header: 'Asset' },
      ]}
      rows={transactions.map((transaction) => {
        return {
          link: `/forced/${transaction.hash.toString()}`,
          cells: [
            transaction.type,
            formatRelativeTime(transaction.lastUpdate),
            transaction.status,
            formatHashLong(transaction.hash),
            transaction.positionId.toString(),
            formatCurrencyUnits(transaction.amount, transaction.assetId),
            <AssetCell assetId={transaction.assetId} />,
          ],
        }
      })}
    />
  )
}
