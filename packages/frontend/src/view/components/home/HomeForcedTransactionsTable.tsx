import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { formatTimestamp } from '../../../utils/formatting/formatTimestamp'
import { AssetWithLogo } from '../common/AssetWithLogo'
import { StatusBadge, StatusType } from '../common/StatusBadge'
import { Table } from '../common/table/Table'

export interface HomeForcedTransactionEntry {
  timestamp: Timestamp
  hash: Hash256
  asset: Asset
  amount: bigint
  status: 'MINED' | 'INCLUDED'
  type: 'WITHDRAW' | 'BUY' | 'SELL'
}

export interface HomeForcedTransactionsTableProps {
  forcedTransactions: HomeForcedTransactionEntry[]
}

export function HomeForcedTransactionsTable(
  props: HomeForcedTransactionsTableProps
) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Hash' },
        { header: 'Asset' },
        { header: 'Amount', numeric: true },
        { header: 'Status' },
        { header: 'Type' },
      ]}
      rows={props.forcedTransactions.map((transaction) => {
        return {
          link: `/forced-transactions/${transaction.hash.toString()}`,
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
            <span className="capitalize">
              {transaction.type.toLowerCase()}
            </span>,
          ],
        }
      })}
    />
  )
}

function toStatusType(
  status: HomeForcedTransactionEntry['status']
): StatusType {
  switch (status) {
    case 'MINED':
      return 'BEGIN'
    case 'INCLUDED':
      return 'END'
  }
}
