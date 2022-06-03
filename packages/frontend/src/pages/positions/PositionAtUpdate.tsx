import React from 'react'

import { AssetCell } from '../common/AssetCell'
import { Page } from '../common/Page'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/table'
import {
  formatAbsoluteTime,
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
import { PositionAtUpdateProps } from './PositionAtUpdateProps'

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
    <AssetCell assetId={assetId} />,
    previousBalance.toString(),
    currentBalance.toString(),
    balanceDiff.toString(),
  ],
})

export function PositionAtUpdate({
  positionId,
  assetChanges,
  previousstarkKey,
  starkKey,
  stateUpdateId,
  lastUpdateTimestamp,
  transactions,
  account,
}: PositionAtUpdateProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()} at ${stateUpdateId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
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
            content: formatAbsoluteTime(lastUpdateTimestamp),
            fontRegular: true,
          },
          {
            title: 'Previous stark key',
            content: previousstarkKey ? formatHashLong(previousstarkKey) : '-',
          },
          {
            title: 'Stark key',
            content: formatHashLong(starkKey),
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
          { header: 'Hash', monospace: true, fullWidth: true },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
        ]}
        rows={transactions.map((transaction) => {
          const link = `/forced/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatRelativeTime(transaction.lastUpdate),
              formatHashLong(transaction.hash),
              formatCurrencyUnits(transaction.amount, transaction.assetId),
              <AssetCell assetId={transaction.assetId} />,
            ],
          }
        })}
      />
    </Page>
  )
}
