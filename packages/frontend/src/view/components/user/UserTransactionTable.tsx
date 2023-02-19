import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { formatTimestamp } from '../../../utils/formatting/formatTimestamp'
import { AssetWithLogo } from '../common/AssetWithLogo'
import { StatusBadge, StatusType } from '../common/StatusBadge'
import { Table } from '../common/table/Table'

export interface UserTransactionTableProps {
  transactions: UserTransactionEntry[]
}

export interface UserTransactionEntry {
  timestamp: Timestamp
  hash: Hash256
  asset: Asset
  amount: bigint
  status:
    | 'SENT (1/3)'
    | 'MINED (2/3)'
    | 'INCLUDED (3/3)'
    | 'SENT (1/2)'
    | 'MINED (2/2)'
    | 'REVERTED'
  type: 'Forced withdraw' | 'Forced buy' | 'Forced sell' | 'Withdraw'
}

export function UserTransactionTable(props: UserTransactionTableProps) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Hash' },
        { header: 'Asset' },
        { header: 'Amount' },
        { header: 'Status' },
        { header: 'Type' },
      ]}
      rows={props.transactions.map((transaction) => {
        return {
          link: `/transactions/${transaction.hash.toString()}`,
          cells: [
            formatTimestamp(transaction.timestamp),
            // TODO: fix truncate and underline
            <span className="block max-w-[80px] truncate text-blue-600 underline">
              {transaction.hash}
            </span>,
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo(transaction.asset)}
            />,
            formatAmount(transaction.asset, transaction.amount),
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

function toStatusType(status: UserTransactionEntry['status']): StatusType {
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
