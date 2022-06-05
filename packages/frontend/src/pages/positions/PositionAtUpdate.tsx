import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { StatsTable } from '../common/table/StatsTable'
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
  previousStarkKey,
  starkKey,
  stateUpdateId,
  lastUpdateTimestamp,
  transactions,
  account,
}: PositionAtUpdateProps) {
  return (
    <Page
      title={`Position ${positionId} at update ${stateUpdateId}`}
      description="View changes to this position that occurred during a specific state update."
      path={`/positions/${positionId}/updates/${stateUpdateId}`}
      account={account}
    >
      <PageHeading>
        Position #{positionId.toString()} - Update at #
        {stateUpdateId.toString()}
      </PageHeading>
      <SectionHeading>Stats</SectionHeading>
      <StatsTable
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
            content: previousStarkKey ? formatHashLong(previousStarkKey) : '-',
          },
          {
            title: 'Stark key',
            content: formatHashLong(starkKey),
          },
        ]}
      />
      <SectionHeading>Balance changes</SectionHeading>
      <Table
        noRowsText="no balance changes happened in this update"
        columns={balanceChangesTableColumns}
        rows={assetChanges.map(buildBalanceChangesTableRow)}
      />
      <SectionHeading>Included forced transactions</SectionHeading>
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
