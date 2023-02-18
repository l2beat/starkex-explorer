import { Timestamp } from '@explorer/types'
import React from 'react'

import { StatusBadge, StatusType } from '../common/StatusBadge'
import { Table } from '../common/table/Table'

export interface EthereumTransactionsTableProps {
  readonly ethereumTransactions: readonly EthereumTransactionEntry[]
}

export interface EthereumTransactionEntry {
  readonly timestamp: Timestamp
  readonly hash: string
  readonly asset: string
  readonly assetIcon: string
  readonly amount: bigint
  readonly status:
    | 'SENT (1/3)'
    | 'MINED (2/3)'
    | 'INCLUDED (3/3)'
    | 'SENT (1/2)'
    | 'MINED (2/2)'
    | 'REVERTED'
  readonly type:
    | 'Forced withdrawal'
    | 'Forced buy'
    | 'Forced sell'
    | 'Wtihdrawal'
}

export function EthereumTransactionsTable({
  ethereumTransactions,
}: EthereumTransactionsTableProps) {
  return (
    <Table
      columns={[
        { header: 'TIME' },
        { header: 'HASH' },
        { header: 'ASSET' },
        { header: 'AMOUNT' },
        { header: 'STATUS' },
        { header: 'TYPE' },
      ]}
      rows={ethereumTransactions.map((transaction) => {
        const link = `/ethereumTransactions/${transaction.hash}` //TODO: Construct a proper link
        const date = new Date(transaction.timestamp.valueOf())
        return {
          link,
          cells: [
            `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
            <a href={`etherscan link`} className="text-blue-300 underline">
              {transaction.hash.substring(0, 7)}...
            </a>,
            transaction.asset,
            transaction.amount.toString(),
            <StatusBadge type={toStatusType(transaction.status)}>
              {transaction.status}
            </StatusBadge>,
            transaction.type,
          ],
        }
      })}
    />
  )
}

function toStatusType(status: EthereumTransactionEntry['status']): StatusType {
  switch (status) {
    case 'SENT (1/3)':
    case 'SENT (1/2)':
      return 'BEGIN'
    case 'MINED (2/3)':
      return 'MIDDLE'
    case 'INCLUDED (3/3)':
    case 'MINED (2/2)':
      return 'END'
    case 'REVERTED':
      return 'ERROR'
  }
}
