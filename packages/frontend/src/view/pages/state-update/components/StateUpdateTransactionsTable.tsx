import { Hash256 } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'
import { StatusBadge } from '../../../components/StatusBadge'
import { Table } from '../../../components/table/Table'

export interface StateUpdateTransactionsTableProps {
  transactions: StateUpdateTransactionEntry[]
}

export interface StateUpdateTransactionEntry {
  hash: Hash256
  asset: Asset
  amount: bigint
  type: 'WITHDRAW' | 'BUY' | 'SELL'
}

export function StateUpdateTransactionsTable(
  props: StateUpdateTransactionsTableProps
) {
  return (
    <Table
      columns={[
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
            <Link>
              <InlineEllipsis className="max-w-[80px] sm:max-w-[160px]">
                {transaction.hash.toString()}
              </InlineEllipsis>
            </Link>,
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo(transaction.asset)}
            />,
            formatAmount(transaction.asset, transaction.amount),
            <StatusBadge type={'END'}>INCLUDED</StatusBadge>,
            <span className="capitalize">
              {transaction.type.toLowerCase()}
            </span>,
          ],
        }
      })}
    />
  )
}
