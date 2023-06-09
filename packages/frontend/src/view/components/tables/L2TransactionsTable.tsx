import { assertUnreachable, L2TransactionData } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import React, { ReactNode } from 'react'

import { assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
import { AssetWithLogo } from '../AssetWithLogo'
import { InlineEllipsis } from '../InlineEllipsis'
import { Link } from '../Link'
import { StatusBadge, StatusType } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'

export interface L2TransactionsTableProps {
  transactions: L2TransactionEntry[]
}

export interface L2TransactionEntry {
  transactionId: number
  data: L2TransactionData
  status: 'PENDING' | 'INCLUDED'
}

export function L2TransactionsTable(props: L2TransactionsTableProps) {
  const columns: Column[] = [
    { header: 'Type' },
    { header: `Transaction id` },
    { header: 'Status' },
  ]

  return (
    <Table
      columns={columns}
      rows={props.transactions.map((transaction) => {
        const status = getStatus(transaction)
        const cells: ReactNode[] = [
          <TypeCell data={transaction.data} />,
          <Link>#{transaction.transactionId}</Link>,
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

interface TypeCellProps {
  data: L2TransactionData
}
function TypeCell({ data }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {toTypeText(data.type)}
      <FreeForm data={data} />
    </span>
  )
}

function FreeForm({ data }: TypeCellProps) {
  switch (data.type) {
    case 'Deposit':
      return (
        <FreeFormCard>
          {formatAmount({ hashOrId: AssetId('USDC-6') }, data.amount)}
          <AssetWithLogo
            type="small"
            assetInfo={assetToInfo({
              hashOrId: AssetId('USDC-6'),
            })}
          />
        </FreeFormCard>
      )
    case 'Trade':
      return (
        <>
          <FreeFormCard>
            {formatAmount(
              { hashOrId: data.partyAOrder.syntheticAssetId },
              data.partyAOrder.syntheticAmount
            )}
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo({
                hashOrId: data.partyAOrder.syntheticAssetId,
              })}
            />
            <ArrowRightIcon />
            {formatAmount(
              { hashOrId: data.partyBOrder.syntheticAssetId },
              data.partyBOrder.syntheticAmount
            )}
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo({
                hashOrId: data.partyBOrder.syntheticAssetId,
              })}
            />
          </FreeFormCard>
          <FreeFormCard>
            <FreeFormLink>{data.partyAOrder.starkKey}</FreeFormLink>
            <ArrowRightIcon />
            <FreeFormLink>{data.partyBOrder.starkKey}</FreeFormLink>
          </FreeFormCard>
        </>
      )
    case 'Transfer':
    case 'ConditionalTransfer':
      return (
        <>
          <FreeFormCard>
            {formatAmount({ hashOrId: AssetId('USDC-6') }, data.amount)}
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo({
                hashOrId: AssetId('USDC-6'),
              })}
            />
          </FreeFormCard>
          <FreeFormCard>
            <FreeFormLink>{data.senderStarkKey}</FreeFormLink>
            <ArrowRightIcon />
            <FreeFormLink>{data.receiverStarkKey}</FreeFormLink>
          </FreeFormCard>
        </>
      )
    case 'WithdrawToAddress':
      return (
        <>
          <FreeFormCard>
            {formatAmount({ hashOrId: AssetId('USDC-6') }, data.amount)}
            <AssetWithLogo
              type="small"
              assetInfo={assetToInfo({
                hashOrId: AssetId('USDC-6'),
              })}
            />
          </FreeFormCard>
          <FreeFormCard>
            <FreeFormLink>{data.starkKey}</FreeFormLink>
            <ArrowRightIcon />
            <FreeFormLink>{data.ethereumAddress}</FreeFormLink>
          </FreeFormCard>
        </>
      )
    default:
      return null
  }
}

function FreeFormCard({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-7 items-center gap-1 rounded bg-gray-800 px-2 py-1">
      {children}
    </span>
  )
}

function FreeFormLink({ children }: { children: ReactNode }) {
  return <InlineEllipsis className="max-w-[60px]">{children}</InlineEllipsis>
}

export function toTypeText(type: L2TransactionEntry['data']['type']): string {
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
