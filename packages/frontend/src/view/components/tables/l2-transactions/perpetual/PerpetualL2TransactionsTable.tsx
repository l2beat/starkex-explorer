import { CollateralAsset } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { AlternativeTransactionIcon } from '../../../../assets/icons/AlternativeTransactionIcon'
import { MultiTransactionIcon } from '../../../../assets/icons/MultiTransactionIcon'
import { ReplacedTransactionIcon } from '../../../../assets/icons/ReplacedTransactionIcon'
import {
  getL2TransactionStatusBadgeValues,
  l2TransactionTypeToText,
  PerpetualL2TransactionEntry,
} from '../../../../pages/l2-transaction/common'
import { Link } from '../../../Link'
import { StatusBadge } from '../../../StatusBadge'
import { Table } from '../../../table/Table'
import { Column } from '../../../table/types'
import { TooltipWrapper } from '../../../Tooltip'
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
        <TooltipWrapper
          content={`This transaction is an alternative or one of the alternatives of transaction #${transaction.transactionId}`}
        >
          {transaction.state === 'alternative' && (
            <AlternativeTransactionIcon className="scale-75 fill-cyan-400" />
          )}
        </TooltipWrapper>
        {transaction.state === 'replaced' && (
          <TooltipWrapper content="This transaction has been replaced">
            <ReplacedTransactionIcon className="scale-75 fill-yellow-300" />
          </TooltipWrapper>
        )}
        {transaction.isPartOfMulti && (
          <TooltipWrapper
            content={`This transaction is included in multi transaction #${transaction.transactionId}`}
          >
            <MultiTransactionIcon className="scale-75 fill-orange-500" />
          </TooltipWrapper>
        )}
      </div>
    </span>
  )
}
