import {
  assertUnreachable,
  CollateralAsset,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import React, { ReactNode } from 'react'

import { l2TransactionTypeToText } from '../../../pages/l2-transaction/common'
import { Table } from '../../table/Table'
import { Column } from '../../table/types'
import { PerpetualL2TransactionFreeForm } from './perpetual/PerpetualL2TransactionFreeForm'

export interface L2MultiOrAlternativeTransactionsTableProps {
  transactionId: number
  contentState: 'alternative' | 'multi'
  transactions: PerpetualL2TransactionData[]
  collateralAsset: CollateralAsset
  altIndex?: number
}

export function L2MultiOrAlternativeTransactionsTable(
  props: L2MultiOrAlternativeTransactionsTableProps
) {
  const columns: Column[] = [
    { header: '#', numeric: true, minimalWidth: true },
    { header: 'Type' },
  ]

  return (
    <Table
      columns={columns}
      alignLastColumnRight={false}
      rows={props.transactions.map((transaction, index) => {
        const cells: ReactNode[] = [
          <span>{index}</span>,
          <TypeCell
            transaction={transaction}
            collateralAsset={props.collateralAsset}
          />,
        ]
        const altIndex =
          props.altIndex ??
          (props.contentState === 'alternative' ? index : undefined)

        const multiIndex = props.contentState === 'multi' ? index : undefined
        const query = getQuery(props.contentState, altIndex, multiIndex)
        return {
          link: `/l2-transactions/${props.transactionId.toString()}` + query,
          cells,
        }
      })}
    />
  )
}

interface TypeCellProps {
  transaction: PerpetualL2TransactionData
  collateralAsset: CollateralAsset
}
function TypeCell({ transaction, collateralAsset }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {l2TransactionTypeToText(transaction.type)}
      <PerpetualL2TransactionFreeForm
        data={transaction}
        collateralAsset={collateralAsset}
      />
    </span>
  )
}

const getQuery = (
  contentState: L2MultiOrAlternativeTransactionsTableProps['contentState'],
  altIndex?: number,
  multiIndex?: number
) => {
  switch (contentState) {
    case 'multi':
      return altIndex !== undefined
        ? `/alternatives/${altIndex}/${multiIndex}`
        : `/${multiIndex}`
    case 'alternative':
      return `/alternatives/${altIndex}`
    default:
      assertUnreachable(contentState)
  }
}
