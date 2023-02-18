import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assetUtils'
import { formatTimestamp } from '../../../utils/formatUtils'
import { AssetWithLogo } from '../common/AssetWithLogo'
import { StatusBadge, StatusType } from '../common/StatusBadge'
import { Table } from '../common/table/Table'

export interface HomeForcedTransactionEntry {
  timestamp: Timestamp
  hash: Hash256
  asset: Asset
  amount: bigint
  status: 'MINED' | 'INCLUDED'
  type: 'WITHDRAWAL' | 'BUY' | 'SELL'
}

export interface HomeForcedTransactionTableProps {
  forcedTransactions: HomeForcedTransactionEntry[]
}

export function HomeForcedTransactionTable(
  props: HomeForcedTransactionTableProps
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
            transaction.amount.toString(), // TODO: format
            <StatusBadge type={toStatusType(transaction.status)}>
              {transaction.status}
            </StatusBadge>,
            `Forced ${transaction.type.toLowerCase()}`,
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
