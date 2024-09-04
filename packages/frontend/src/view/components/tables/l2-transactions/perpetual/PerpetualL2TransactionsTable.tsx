import { CollateralAsset } from '@explorer/shared'
import classNames from 'classnames'
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
import { TimeAgeCell } from '../../../TimeAgeCell'
import { TooltipWrapper } from '../../../Tooltip'
import { PerpetualL2TransactionInfoCell } from './PerpetualL2TransactionInfoCell'

export interface PerpetualL2TransactionsTableProps {
  transactions: PerpetualL2TransactionEntry[]
  collateralAsset: CollateralAsset
  showInfo: boolean
  isHomePage?: boolean
}

export function PerpetualL2TransactionsTable(
  props: PerpetualL2TransactionsTableProps
) {
  const columns: Column[] = [
    { header: 'ID', className: classNames(props.isHomePage && 'w-[130px]') },
    { header: 'Type' },
    ...(props.showInfo
      ? [{ header: 'Info', className: classNames(props.isHomePage && 'w-max') }]
      : []),
    {
      header: 'Status',
      className: classNames(props.isHomePage && 'w-[140px]'),
    },
    { header: 'Age', className: classNames(props.isHomePage && 'w-[90px]') },
  ]

  return (
    <Table
      columns={columns}
      rows={props.transactions.map((transaction) => {
        const statusBadgeValues = getL2TransactionStatusBadgeValues(
          transaction.stateUpdateId
        )
        const cells: ReactNode[] = [
          <Link>#{transaction.transactionId}</Link>,
          <TypeCell transaction={transaction} />,
          ...(props.showInfo
            ? [
                <PerpetualL2TransactionInfoCell
                  data={transaction.data}
                  collateralAsset={props.collateralAsset}
                />,
              ]
            : []),
          <StatusBadge type={statusBadgeValues.type}>
            {statusBadgeValues.text}
          </StatusBadge>,
          transaction.timestamp ? (
            <TimeAgeCell timestamp={transaction.timestamp} />
          ) : (
            '-'
          ),
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
}
function TypeCell({ transaction }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {l2TransactionTypeToText(transaction.data.type)}
      {(transaction.state || transaction.isPartOfMulti) && (
        <div className="flex gap-1">
          {transaction.state === 'alternative' && (
            <TooltipWrapper
              content={`This transaction is an alternative or one of the alternatives of transaction #${transaction.transactionId}`}
            >
              <AlternativeTransactionIcon className="scale-75 fill-cyan-400" />
            </TooltipWrapper>
          )}
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
      )}
    </span>
  )
}
