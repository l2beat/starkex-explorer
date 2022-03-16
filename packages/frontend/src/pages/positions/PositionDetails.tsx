import React from 'react'
import { formatUSDCents } from '../formatUSDCents'
import { Page } from '../common/Page'
import { Table } from '../common/Table'
import { PositionDetailsProps } from './PositionDetailsProps'

const assetTableColumns = [
  { header: 'Asset id' },
  { header: 'Balance', numeric: true },
  { header: 'Value', numeric: true },
  { header: 'Price', numeric: true },
]
const buildAssetTableRow = ({
  assetId,
  balance,
  totalUSDCents,
  price,
}: PositionDetailsProps['assets'][number]) => ({
  cells: [
    assetId.toString(),
    balance.toString(),
    formatUSDCents(totalUSDCents),
    price ? `${formatUSDCents(price)}` : '-',
  ],
})

const updateHistoryTableColumns = [
  { header: 'State update' },
  { header: 'Value before', numeric: true },
  { header: 'Value after', numeric: true },
  { header: 'Asset updates', numeric: true },
]
const buildUpdateHistoryTableRow = (
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
    cells: [
      stateUpdateId.toString(),
      valueBefore,
      formatUSDCents(totalUSDCents),
      assetsUpdated.toString(),
    ],
  }
}

export function PositionDetails({
  positionId,
  assets,
  publicKey,
  totalUSDCents,
  history,
}: PositionDetailsProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Position #{positionId.toString()}
      </h1>
      <h2 className="mb-2">
        <span className="font-bold font-sans text-xl">Total: </span>
        <span className="font-mono text-lg">
          {formatUSDCents(totalUSDCents)}
        </span>
      </h2>
      <h2 className="mb-12">
        <span className="font-bold font-sans text-xl">Key: </span>
        <span className="font-mono text-lg">{publicKey}</span>
      </h2>
      <div className="mb-1.5 font-medium text-lg text-left">Assets</div>
      <Table
        className="mb-8"
        columns={assetTableColumns}
        rows={assets.map(buildAssetTableRow)}
      />
      <div className="mb-1.5 font-medium text-lg text-left">Update history</div>
      <Table
        columns={updateHistoryTableColumns}
        rows={history.map(buildUpdateHistoryTableRow)}
      />
    </Page>
  )
}
