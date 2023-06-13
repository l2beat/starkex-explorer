import { AssetId } from '@explorer/types'
import React, { ReactNode } from 'react'

import { assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import {
  getL2TransactionStatusBadgeValues,
  PerpetualL2TransactionEntry,
  perpetualL2TransactionTypeToText,
} from '../../../pages/l2-transaction/common'
import { AssetWithLogo } from '../../AssetWithLogo'
import { InlineEllipsis } from '../../InlineEllipsis'
import { Link } from '../../Link'
import { StatusBadge } from '../../StatusBadge'
import { Table } from '../../table/Table'
import { Column } from '../../table/types'
import { ReplacedBadge } from './ReplacedBadge'

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
          <TypeCell transaction={transaction} />,
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
}
function TypeCell({ transaction }: TypeCellProps) {
  return (
    <span className="flex items-center gap-3">
      {perpetualL2TransactionTypeToText(transaction.data.type)}
      <FreeForm data={transaction.data} />
      <div className="ml-auto flex gap-2">
        {transaction.state === 'alternative' && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-400">
            A
          </span>
        )}
        {transaction.state === 'replaced' && <ReplacedBadge />}
        {transaction.isPartOfMulti && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fuchsia-400">
            M
          </span>
        )}
      </div>
    </span>
  )
}

interface FreeFormProps {
  data: PerpetualL2TransactionEntry['data']
}

function FreeForm({ data }: FreeFormProps) {
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
