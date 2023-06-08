import { assertUnreachable } from '@explorer/shared'
import React, { ReactNode } from 'react'

import { Link } from '../Link'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'

export interface L2TransactionsTableProps {
  transactions: L2TransactionEntry[]
}

export interface L2TransactionEntry {
  stateUpdateId: number | undefined
  transactionId: number
  type:
    | 'Deposit'
    | 'WithdrawToAddress'
    | 'ForcedWithdrawal'
    | 'Trade'
    | 'ForcedTrade'
    | 'Transfer'
    | 'ConditionalTransfer'
    | 'Liquidate'
    | 'Deleverage'
    | 'FundingTick'
    | 'OraclePricesTick'
    | 'MultiTransaction'
  status: 'PENDING' | 'INCLUDED'
}

export function L2TransactionsTable(props: L2TransactionsTableProps) {
  const columns: Column[] = [
    { header: `Transaction id` },
    { header: 'State update id' },
    { header: 'Type' },
    { header: 'Status' },
  ]

  return (
    <Table
      columns={columns}
      rows={props.transactions.map((transaction) => {
        const status = getStatus(transaction)
        const cells: ReactNode[] = [
          <Link>#{transaction.transactionId}</Link>,
          <span>{transaction.stateUpdateId ?? '-'}</span>,
          <span>{toTypeText(transaction.type)}</span>,
          <StatusBadge type={status.type}>{status.text}</StatusBadge>,
        ]

        return {
          link: `/live-transactions/${transaction.transactionId.toString()}`,
          cells,
        }
      })}
    />
  )
}

export function toTypeText(type: L2TransactionEntry['type']): string {
  switch (type) {
    case 'Deposit':
    case 'Trade':
    case 'Transfer':
    case 'Liquidate':
    case 'Deleverage':
      return type
    case 'ConditionalTransfer':
      return 'Conditional transfer'
    case 'WithdrawToAddress':
      return 'Withdraw to address'
    case 'ForcedWithdrawal':
      return 'Forced withdrawal'
    case 'ForcedTrade':
      return 'Forced trade'
    case 'FundingTick':
      return 'Funding tick'
    case 'OraclePricesTick':
      return 'Oracle prices tick'
    case 'MultiTransaction':
      return 'Multi transaction'
    default:
      assertUnreachable(type)
  }
}

function getStatus(transaction: L2TransactionEntry): {
  type: StatusType
  text: string
} {
  switch (transaction.status) {
    case 'PENDING':
      return { type: 'BEGIN', text: 'Pending (1/2)' }
    case 'INCLUDED':
      return { type: 'END', text: 'Included (2/2)' }
    default:
      assertUnreachable(transaction.status)
  }
}
