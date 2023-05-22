import { TradingMode } from '@explorer/shared'
import { Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { ChangeText } from '../../../components/ChangeText'
import { Link } from '../../../components/Link'
import { Table } from '../../../components/table/Table'
import { TimeCell } from '../../../components/TimeCell'

interface UserBalanceChangesTableProps {
  balanceChanges: UserBalanceChangeEntry[]
  tradingMode: TradingMode
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
        { header: 'Change', numeric: true },
        { header: 'Balance', numeric: true },
        { header: props.tradingMode === 'perpetual' ? 'Position' : 'Vault' },
      ]}
      rows={props.balanceChanges.map((entry) => {
        return {
          link: `/state-updates/${entry.stateUpdateId}`,
          cells: [
            <TimeCell timestamp={entry.timestamp} />,
            <Link>#{entry.stateUpdateId}</Link>,
            <AssetWithLogo type="small" assetInfo={assetToInfo(entry.asset)} />,
            <ChangeText className="text-sm font-medium">
              {formatAmount(entry.asset, entry.change, { signed: true })}
            </ChangeText>,
            formatAmount(entry.asset, entry.balance),
            <span className="text-zinc-500">#{entry.vaultOrPositionId}</span>,
          ],
        }
      })}
    />
  )
}
