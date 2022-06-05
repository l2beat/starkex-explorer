import { AssetId } from '@explorer/types'
import React from 'react'

import { Column, Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { formatCurrency, formatCurrencyUnits } from '../formatting'
import { PositionAssetEntry } from './PositionDetailsProps'

export interface PositionAssetsTableProps {
  readonly assets: readonly PositionAssetEntry[]
  readonly ownedByYou: boolean
}

export function PositionAssetsTable(props: PositionAssetsTableProps) {
  return (
    <Table
      noRowsText="this position has no balances"
      columns={balanceTableColumns(props.ownedByYou)}
      rows={props.assets.map(buildBalanceTableRow(props.ownedByYou))}
    />
  )
}

const balanceTableColumns = (ownedByYou: boolean) => {
  const columns: Column[] = [
    { header: 'Name' },
    { header: 'Balance', numeric: true },
    { header: 'Unit price', numeric: true, fullWidth: true },
    { header: 'Value', numeric: true, fullWidth: true },
  ]

  if (ownedByYou) {
    columns.push({ header: 'Forced' })
  }

  return columns
}

const buildBalanceTableRow =
  (ownedByYou: boolean) => (entry: PositionAssetEntry) => {
    const cells = [
      <AssetCell assetId={entry.assetId} />,
      formatCurrencyUnits(entry.balance, entry.assetId),
      formatCurrency(entry.priceUSDCents, 'USD'),
      formatCurrency(entry.totalUSDCents, 'USD'),
    ]
    if (ownedByYou) {
      cells.push(
        <ActionButton assetId={entry.assetId} balance={entry.balance} />
      )
    }
    return { cells }
  }

interface ActionButtonProps {
  assetId: AssetId
  balance: bigint
}

function ActionButton({ assetId, balance }: ActionButtonProps) {
  if (balance === 0n || (assetId === AssetId.USDC && balance < 0n)) {
    return null
  }
  return (
    <a
      href={`/forced/new?assetId=${assetId}`}
      className="px-3 py-0.5 rounded bg-blue-100"
    >
      {assetId === AssetId.USDC ? 'Exit' : balance < 0n ? 'Buy' : 'Sell'}
    </a>
  )
}
