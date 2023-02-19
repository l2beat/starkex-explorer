import { Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { ChangeText } from '../../../components/ChangeText'
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
        return {
          link: `/state-updates/${entry.stateUpdateId}`,
          cells: [
            <TimeCell timestamp={entry.timestamp} />,
            <span className="text-blue-300 underline">
              #{entry.stateUpdateId}
            </span>,
            <AssetWithLogo type="small" assetInfo={assetToInfo(entry.asset)} />,
            formatAmount(entry.asset, entry.balance),
            <ChangeText className="text-sm font-medium">
              {formatAmount(entry.asset, entry.change, { signed: true })}
            </ChangeText>,
            <span className="text-zinc-500">#{entry.vaultOrPositionId}</span>,
          ],
        }
      })}
    />
  )
}
