import {
  assertUnreachable,
  CollateralAsset,
  PerpetualL2TransactionData,
} from '@explorer/shared'
import React from 'react'

import { L2MultiOrAlternativeTransactionsTableProps } from '../../../components/tables/l2-transactions/L2MultiOrAlternativeTransactionsTable'
import { l2TransactionTypeToText } from '../common'

export interface L2TransactionsListProps {
  transactionId: number
  contentState: 'alternative' | 'multi'
  transactions: PerpetualL2TransactionData[]
  collateralAsset: CollateralAsset
  altIndex?: number
}

export function L2TransactionsList(props: L2TransactionsListProps) {
  return (
    <div className="rounded-lg bg-gray-800">
      {props.transactions.map((transaction, index) => {
        const altIndex =
          props.altIndex ??
          (props.contentState === 'alternative' ? index : undefined)

        const multiIndex = props.contentState === 'multi' ? index : undefined
        const link = getLink(
          props.contentState,
          props.transactionId,
          altIndex,
          multiIndex
        )
        return (
          <a
            href={link}
            className="flex gap-6 rounded-lg py-3 px-4 hover:bg-slate-800"
            key={`${transaction.type}-${index}`}
          >
            <span className="opacity-40">#{index}</span>
            <span>{l2TransactionTypeToText(transaction.type)}</span>
          </a>
        )
      })}
    </div>
  )
}

const getLink = (
  contentState: L2MultiOrAlternativeTransactionsTableProps['contentState'],
  transactionId: number,
  altIndex?: number,
  multiIndex?: number
) => {
  const base = `/l2-transactions/${transactionId.toString()}`
  switch (contentState) {
    case 'multi':
      return base + altIndex !== undefined
        ? `/alternatives/${altIndex}/${multiIndex}`
        : `/${multiIndex}`
    case 'alternative':
      return base + `/alternatives/${altIndex}`
    default:
      assertUnreachable(contentState)
  }
}
