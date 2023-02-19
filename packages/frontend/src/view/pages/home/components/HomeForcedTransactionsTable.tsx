import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

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
            <TimeCell timestamp={transaction.timestamp} />,
            <span className="inline-block max-w-[80px] truncate py-1 text-blue-600 underline">
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
