import { TradingMode } from '@explorer/shared'
import { Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { ChangeText } from '../../../components/ChangeText'
import { Link } from '../../../components/Link'
import { Table } from '../../../components/table/Table'
import { TimeAgeCell } from '../../../components/TimeAgeCell'

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
        { header: 'Update' },
        { header: props.tradingMode === 'perpetual' ? 'Position' : 'Vault' },
        { header: 'Info' },
        { header: 'Balance', numeric: true },
        { header: 'Age' },
      ]}
      rows={props.balanceChanges.map((entry) => {
        return {
          link: `/state-updates/${entry.stateUpdateId}`,
          cells: [
            <Link>#{entry.stateUpdateId}</Link>,
            <span className="text-zinc-500">#{entry.vaultOrPositionId}</span>,
            <div className="flex items-center gap-2">
              <ChangeText className="text-sm font-medium">
                {formatAmount(entry.asset, entry.change, { signed: true })}
              </ChangeText>
              <AssetWithLogo
                type="small"
                assetInfo={assetToInfo(entry.asset)}
              />
            </div>,
            formatAmount(entry.asset, entry.balance),
            <TimeAgeCell timestamp={entry.timestamp} />,
          ],
        }
      })}
    />
  )
}
