import React from 'react'
import { formatUSDCents } from '../formatUSDCents'
import { Page } from '../common/Page'
import { Table } from '../common/Table'
import { PositionDetailsProps } from './PositionDetailsProps'
import { AssetId } from '@explorer/types'
import { AssetIcon } from '../common/icons/AssetIcon'
import { PositionStats } from './PositionStats'

type AssetCellProps = {
  assetId: AssetId
}

function AssetCell({ assetId }: AssetCellProps) {
  const symbol = AssetId.symbol(assetId)
  return (
    <div className="flex gap-x-1 items-center">
      <AssetIcon assetId={assetId} width="16" height="16" />
      {symbol}
    </div>
  )
}

const balanceTableColumns = [
  { header: 'Name' },
  { header: 'Balance', numeric: true },
  { header: 'Unit price', numeric: true },
  { header: 'Value', numeric: true },
]
const buildBalanceTableRow = ({
  assetId,
  balance,
  totalUSDCents,
  price,
}: PositionDetailsProps['assets'][number]) => ({
  cells: [
    <AssetCell assetId={assetId} />,
    balance.toString(),
    price ? `${formatUSDCents(price)}` : '-',
    formatUSDCents(totalUSDCents),
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
  stateUpdateId,
  lastUpdateTimestamp,
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
      <div className="mb-1.5 font-medium text-lg text-left">Stats</div>
      <PositionStats
        publicKey={publicKey}
        stateUpdateId={stateUpdateId}
        lastUpdateTimestamp={lastUpdateTimestamp}
      />
      <div className="mb-1.5 font-medium text-lg text-left">Balances</div>
      <Table
        className="mb-8"
        columns={balanceTableColumns}
        rows={assets.map(buildBalanceTableRow)}
      />
      <div className="mb-1.5 font-medium text-lg text-left">Update history</div>
      <Table
        columns={updateHistoryTableColumns}
        rows={history.map(buildUpdateHistoryTableRow)}
      />
    </Page>
  )
}
