import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetNameCell } from '../common/AssetNameCell'
import { Page } from '../common/Page'
import { formatTimestamp, PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { Column, Table } from '../common/Table'
import { formatHash } from '../formatHash'
import { formatLargeNumber } from '../formatLargeNumber'
import { formatTime } from '../formatTime'
import { formatUSDCents } from '../formatUSDCents'
import { PositionDetailsProps } from './PositionDetailsProps'

const balanceTableColumns = (ownedByYou: boolean) => {
  const columns: Column[] = [
    { header: 'Name' },
    { header: 'Balance', numeric: true },
    { header: 'Unit price', numeric: true },
    { header: 'Value', numeric: true },
  ]

  if (ownedByYou) {
    columns.push({ header: 'Forced', className: 'w-0' })
  }

  return columns
}

const ActionButton = ({ text }: { text?: string }) => (
  <>{text && <button className="px-3 rounded bg-blue-100">{text}</button>}</>
)

const actionButtonText = ({
  assetId,
  balance,
}: {
  assetId: AssetId
  balance: bigint
}) => {
  if (assetId === AssetId.USDC && balance !== 0n) {
    return 'Exit'
  }
  if (balance > 0) {
    return 'Sell'
  } else if (balance < 0) {
    return 'Buy'
  }
}

const buildBalanceTableRow =
  (ownedByYou: boolean) =>
  ({
    assetId,
    balance,
    totalUSDCents,
    price,
  }: PositionDetailsProps['assets'][number]) => {
    const cells = [
      <AssetNameCell assetId={assetId} />,
      balance.toString(),
      price ? `${formatUSDCents(price)}` : '-',
      formatUSDCents(totalUSDCents),
    ]
    if (ownedByYou) {
      cells.push(<ActionButton text={actionButtonText({ assetId, balance })} />)
    }
    return { cells }
  }

const updateHistoryTableColumns = [
  { header: 'State update' },
  { header: 'Value before', numeric: true },
  { header: 'Value after', numeric: true },
  { header: 'Asset updates', numeric: true },
]
const buildUpdateHistoryTableRow =
  (positionId: bigint) =>
  (
    {
      stateUpdateId,
      totalUSDCents,
      assetsUpdated,
    }: PositionDetailsProps['history'][number],
    i: number,
    history: PositionDetailsProps['history']
  ) => {
    const previousTotal = history[i + 1]?.totalUSDCents
    const valueBefore = previousTotal ? `${formatUSDCents(previousTotal)}` : '-'

    return {
      link: `/positions/${positionId}/updates/${stateUpdateId}`,
      cells: [
        stateUpdateId.toString(),
        valueBefore,
        formatUSDCents(totalUSDCents),
        assetsUpdated.toString(),
      ],
    }
  }

const transactionHistoryTableColumns = [
  { header: 'Type' },
  { header: 'Time' },
  { header: 'Status' },
  { header: 'Hash', cellFontMono: true, maxWidthClass: 'max-w-[250px]' },
  { header: 'Amount', numeric: true },
  { header: 'Asset' },
]

const buildTransactionHistoryTableRow = (
  transaction: PositionDetailsProps['transactions'][number]
) => {
  const link = `/forced-transactions/${transaction.hash}`
  return {
    link,
    cells: [
      transaction.type,
      formatTime(transaction.lastUpdate),
      transaction.status,
      formatHash(transaction.hash.toString()),
      formatLargeNumber(transaction.amount),
      <AssetNameCell assetId={transaction.assetId} />,
    ],
  }
}

export function PositionDetails({
  positionId,
  assets,
  publicKey,
  stateUpdateId,
  lastUpdateTimestamp,
  ethAddress,
  history,
  transactions,
  account,
}: PositionDetailsProps) {
  const ownedByYou = ethAddress === account
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <div className="mb-12 flex items-center">
        <h1 className="font-sans font-bold text-2xl">
          Position #{positionId.toString()}
        </h1>
        {ownedByYou && (
          <span className="ml-4 px-2 bg-blue-100 rounded-full">
            Owned by you
          </span>
        )}
      </div>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats
        rows={[
          {
            title: 'Owner ETH address',
            content: ethAddress || '-',
          },
          {
            title: 'Owner stark key',
            content: formatHash(publicKey),
          },
          {
            title: 'Last state update',
            content: (
              <SimpleLink href={`/state-updates/${stateUpdateId}`}>
                #{stateUpdateId.toString()}
              </SimpleLink>
            ),
          },
          {
            title: 'Last update timestamp',
            content: formatTimestamp(lastUpdateTimestamp),
            fontRegular: true,
          },
        ]}
      />
      <div className="mb-1.5 font-medium text-lg text-left">Balances</div>
      <Table
        noRowsText="this position has no balances"
        className="mb-8"
        columns={balanceTableColumns(ownedByYou)}
        rows={assets.map(buildBalanceTableRow(ownedByYou))}
      />
      <div className="mb-1.5 font-medium text-lg text-left">Update history</div>
      <Table
        noRowsText="this position has no update history"
        className="mb-8"
        columns={updateHistoryTableColumns}
        rows={history.map(buildUpdateHistoryTableRow(positionId))}
      />
      <div className="mb-1.5 font-medium text-lg text-left">
        Force transaction history
      </div>
      <Table
        noRowsText="there are no forced transactions associated with this position"
        columns={transactionHistoryTableColumns}
        rows={transactions.map(buildTransactionHistoryTableRow)}
      />
    </Page>
  )
}
