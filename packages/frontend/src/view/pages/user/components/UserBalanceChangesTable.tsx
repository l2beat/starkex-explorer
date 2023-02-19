import { Timestamp } from '@explorer/types'
import cx from 'classnames'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

export interface UserBalanceChangesTableProps {
  balanceChanges: UserBalanceChangeEntry[]
  type: 'SPOT' | 'PERPETUAL'
}

export interface UserBalanceChangeEntry {
  timestamp: Timestamp
  stateUpdateId: string
  asset: Asset
  balance: bigint
  change: bigint
  vaultOrPositionId: string
}

export function UserBalanceChangesTable(props: UserBalanceChangesTableProps) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Update' },
        { header: 'Asset' },
        { header: 'Balance', numeric: true },
        { header: 'Change', numeric: true },
        { header: props.type === 'PERPETUAL' ? 'Position' : 'Vault' },
      ]}
      rows={props.balanceChanges.map((entry) => {
        const change = formatAmount(entry.asset, entry.change, { signed: true })
        return {
          cells: [
            <TimeCell timestamp={entry.timestamp} />,
            <a
              href={`/state-updates/${entry.stateUpdateId}`}
              className="text-blue-300 underline"
            >
              #{entry.stateUpdateId}
            </a>,
            <AssetWithLogo type="small" assetInfo={assetToInfo(entry.asset)} />,
            formatAmount(entry.asset, entry.balance),
            <span
              className={cx(
                'text-sm font-medium',
                change.startsWith('-') && 'text-red-400',
                change.startsWith('+') && 'text-emerald-400',
                change.startsWith('0') && 'text-zinc-500'
              )}
            >
              {change}
            </span>,
            <span className="text-zinc-500">#{entry.vaultOrPositionId}</span>,
          ],
        }
      })}
    />
  )
}
