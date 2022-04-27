import React from 'react'
import { Page } from '../common/Page'
import { Table } from '../common/Table'
import { formatTimestamp, PageHeaderStats } from '../common/PageHeaderStats'
import { PositionAtUpdateProps } from './PositionAtUpdateProps'
import { SimpleLink } from '../common/SimpleLink'
import { formatHash } from '../formatHash'
import { AssetNameCell } from '../common/AssetNameCell'
import { formatLargeNumber } from '../formatLargeNumber'
import { formatTime } from '../formatTime'

const balanceChangesTableColumns = [
  { header: 'Name' },
  { header: 'Previous balance', numeric: true },
  { header: 'New balance', numeric: true },
  { header: 'Difference', numeric: true },
]
const buildBalanceChangesTableRow = ({
  assetId,
  previousBalance,
  currentBalance,
  balanceDiff,
}: PositionAtUpdateProps['assetChanges'][number]) => ({
  cells: [
    <AssetNameCell assetId={assetId} />,
    previousBalance.toString(),
    currentBalance.toString(),
    balanceDiff.toString(),
  ],
})

export function PositionAtUpdate({
  positionId,
  assetChanges,
  previousPublicKey,
  publicKey,
  stateUpdateId,
  lastUpdateTimestamp,
  transactions,
}: PositionAtUpdateProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()} at ${stateUpdateId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Position #{positionId.toString()} - Update at #
        {stateUpdateId.toString()}
      </h1>
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PageHeaderStats
        rows={[
          {
            title: 'State update',
            content: (
              <SimpleLink href={`/state-updates/${stateUpdateId}`}>
                #{stateUpdateId.toString()}
              </SimpleLink>
            ),
          },
          {
            title: 'Position',
            content: (
              <SimpleLink href={`/positions/${positionId}`}>
                #{positionId.toString()}
              </SimpleLink>
            ),
          },
          {
            title: 'State update timestamp',
            content: formatTimestamp(lastUpdateTimestamp),
            fontRegular: true,
          },
          {
            title: 'Previous stark key',
            content: previousPublicKey ? formatHash(previousPublicKey) : '-',
          },
          {
            title: 'Stark key',
            content: formatHash(publicKey),
          },
        ]}
      />
      <div className="mb-1.5 font-medium text-lg text-left">
        Balance changes
      </div>
      <Table
        noRowsText="no balance changes happened in this update"
        className="mb-8"
        columns={balanceChangesTableColumns}
        rows={assetChanges.map(buildBalanceChangesTableRow)}
      />
      <div className="mb-1.5 font-medium text-lg text-left">
        Included forced transactions
      </div>
      <Table
        noRowsText="no forced transactions were included in this update"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          {
            header: 'Hash',
            cellFontMono: true,
            maxWidthClass: 'max-w-[250px]',
          },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
        ]}
        rows={transactions.map((transaction) => {
          const link = `/forced-transactions/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatTime(transaction.lastUpdate),
              formatHash(transaction.hash.toString()),
              formatLargeNumber(transaction.amount),
              <AssetNameCell assetId={transaction.assetId} />,
            ],
          }
        })}
      />
    </Page>
  )
}
