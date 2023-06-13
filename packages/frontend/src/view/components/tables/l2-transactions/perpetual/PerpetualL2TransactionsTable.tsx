import { CollateralAsset } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { ReplacedIcon } from '../../../../assets/icons/ReplacedIcon'
import {
  getL2TransactionStatusBadgeValues,
  l2TransactionTypeToText,
  PerpetualL2TransactionEntry,
} from '../../../../pages/l2-transaction/common'
import { Link } from '../../../Link'
import { StatusBadge } from '../../../StatusBadge'
import { Table } from '../../../table/Table'
import { Column } from '../../../table/types'
import { PerpetualL2TransactionFreeForm } from './PerpetualL2TransactionFreeForm'

export interface PerpetualL2TransactionsTableProps {
  transactions: PerpetualL2TransactionEntry[]
  collateralAsset: CollateralAsset
}

export function PerpetualL2TransactionsTable(
  props: PerpetualL2TransactionsTableProps
) {
  const columns: Column[] = [
    { header: 'Type' },
    { header: `Transaction id` },
    { header: 'Status' },
  ]

  return (
    <Table
      columns={columns}
      rows={props.transactions.map((transaction) => {
        const statusBadgeValues = getL2TransactionStatusBadgeValues(
          transaction.stateUpdateId
        )
        const cells: ReactNode[] = [
          <TypeCell
            transaction={transaction}
            collateralAsset={props.collateralAsset}
          />,
          <Link>#{transaction.transactionId}</Link>,
          <StatusBadge type={statusBadgeValues.type}>
            {statusBadgeValues.text}
          </StatusBadge>,
        ]

        return {
          link: `/l2-transactions/${transaction.transactionId.toString()}`,
          cells,
        }
      })}
    />
  )
}

interface TypeCellProps {
  transaction: PerpetualL2TransactionEntry
  collateralAsset: CollateralAsset
}
function TypeCell({ transaction, collateralAsset }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {l2TransactionTypeToText(transaction.data.type)}
      <PerpetualL2TransactionFreeForm
        data={transaction.data}
        collateralAsset={collateralAsset}
      />
      <div className="ml-auto flex gap-2">
        {transaction.state === 'alternative' && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-400">
            A
          </span>
        )}
        {transaction.state === 'replaced' && (
          <ReplacedIcon className="fill-yellow-300" />
        )}
        {transaction.isPartOfMulti && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-400">
            M
          </span>
        )}
      </div>
    </span>
  )
}
