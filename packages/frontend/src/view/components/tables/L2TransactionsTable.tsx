import { PerpetualL2TransactionData } from '@explorer/shared'
import { AssetId } from '@explorer/types'
import React, { ReactNode } from 'react'

import { assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { ArrowRightIcon } from '../../assets/icons/ArrowIcon'
import {
  getL2TransactionStatusBadgeValues,
  PerpetualL2TransactionEntry,
  perpetualL2TransactionTypeToText,
} from '../../pages/l2-transaction/common'
import { AssetWithLogo } from '../AssetWithLogo'
import { InlineEllipsis } from '../InlineEllipsis'
import { Link } from '../Link'
import { StatusBadge } from '../StatusBadge'
import { Table } from '../table/Table'
import { Column } from '../table/types'

export interface L2TransactionsTableProps {
  transactions: PerpetualL2TransactionEntry[]
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
        const statusBadgeValues = getL2TransactionStatusBadgeValues(
          transaction.stateUpdateId
        )
        const cells: ReactNode[] = [
          <TypeCell data={transaction.data} />,
          <Link>#{transaction.transactionId}</Link>,
          <StatusBadge type={statusBadgeValues.type}>
            {statusBadgeValues.text}
          </StatusBadge>,
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
  data: PerpetualL2TransactionData
}
function TypeCell({ data }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {perpetualL2TransactionTypeToText(data.type)}
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
