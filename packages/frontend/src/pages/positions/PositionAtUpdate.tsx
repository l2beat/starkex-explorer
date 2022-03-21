import React from 'react'
import { Page } from '../common/Page'
import { Table } from '../common/Table'
import { formatTimestamp, PageHeaderStats } from '../common/PageHeaderStats'
import { PositionAtUpdateProps } from './PositionAtUpdateProps'
import { SimpleLink } from '../common/SimpleLink'
import { formatHash } from '../formatHash'
import { AssetNameCell } from '../common/AssetNameCell'

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
        className="mb-8"
        columns={balanceChangesTableColumns}
        rows={assetChanges.map(buildBalanceChangesTableRow)}
      />
    </Page>
  )
}
