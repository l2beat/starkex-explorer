import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../AssetWithLogo'
import { InlineEllipsis } from '../InlineEllipsis'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { TimeCell } from '../TimeCell'

export interface TransactionsTableProps {
  transactions: TransactionEntry[]
  hideTime?: boolean
}

export interface TransactionEntry {
  timestamp: Timestamp
  hash: Hash256
  asset?: Asset
  amount?: bigint
  status: 'SENT' | 'MINED' | 'INCLUDED' | 'REVERTED'
  type: 'FORCED_WITHDRAW' | 'FORCED_BUY' | 'FORCED_SELL' | 'WITHDRAW'
}

export function TransactionsTable(props: TransactionsTableProps) {
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
        const status = getStatus(transaction)
        return {
          link: `/transactions/${transaction.hash.toString()}`,
          cells: [
            <TimeCell timestamp={transaction.timestamp} />,
            <InlineEllipsis className="max-w-[80px] text-blue-600 underline">
              {transaction.hash.toString()}
            </InlineEllipsis>,
            transaction.asset ? (
              <AssetWithLogo
                type="small"
                assetInfo={assetToInfo(transaction.asset)}
              />
            ) : (
              '-'
            ),
            transaction.asset && transaction.amount !== undefined
              ? formatAmount(transaction.asset, transaction.amount)
              : '-',
            <StatusBadge type={status.type}>{status.text}</StatusBadge>,
            toTypeText(transaction.type),
          ],
        }
      })}
    />
  )
}

export function getStatus(transaction: TransactionEntry): {
  type: StatusType
  text: string
} {
  if (transaction.type === 'FORCED_WITHDRAW') {
    switch (transaction.status) {
      case 'SENT':
        return { type: 'BEGIN', text: 'SENT (1/3)' }
      case 'MINED':
        return { type: 'MIDDLE', text: 'MINED (2/3)' }
      case 'INCLUDED':
        return { type: 'END', text: 'INCLUDED (3/3)' }
      case 'REVERTED':
        return { type: 'ERROR', text: 'REVERTED' }
    }
  }
  if (transaction.type === 'WITHDRAW') {
    switch (transaction.status) {
      case 'SENT':
        return { type: 'BEGIN', text: 'SENT (1/2)' }
      case 'MINED':
        return { type: 'END', text: 'MINED (2/2)' }
      case 'REVERTED':
        return { type: 'ERROR', text: 'REVERTED' }
      case 'INCLUDED':
        throw new Error('WITHDRAW transaction cannot be INCLUDED')
    }
  }
  // FORCED_BUY and FORCED_SELL
  switch (transaction.status) {
    case 'SENT':
      return { type: 'MIDDLE', text: 'SENT (3/5)' }
    case 'MINED':
      return { type: 'MIDDLE', text: 'MINED (4/5)' }
    case 'INCLUDED':
      return { type: 'END', text: 'INCLUDED (5/5)' }
    case 'REVERTED':
      return { type: 'ERROR', text: 'REVERTED' }
  }
}

export function toTypeText(type: TransactionEntry['type']): string {
  switch (type) {
    case 'FORCED_WITHDRAW':
      return 'F. withdraw'
    case 'FORCED_BUY':
      return 'F. buy'
    case 'FORCED_SELL':
      return 'F. sell'
    case 'WITHDRAW':
      return 'Withdraw'
  }
}
