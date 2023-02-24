import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

export interface UserTransactionsTableProps {
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

export function UserTransactionsTable(props: UserTransactionsTableProps) {
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
      rows={props.transactions.map((transaction) => {
        return {
          link: `/transactions/${transaction.hash.toString()}`,
          cells: [
            <TimeCell timestamp={transaction.timestamp} />,
            <Link>
              <InlineEllipsis className="max-w-[80px]">
                {transaction.hash.toString()}
              </InlineEllipsis>
            </Link>,
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

export function toStatusType(
  status: UserTransactionEntry['status']
): StatusType {
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
