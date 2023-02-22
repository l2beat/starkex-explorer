import { StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { ChangeText } from '../../../components/ChangeText'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Table } from '../../../components/table/Table'

export interface StateUpdateBalanceChangesTableProps {
  balanceChanges: StateUpdateBalanceChangeEntry[]
  type: 'SPOT' | 'PERPETUAL'
}

export interface StateUpdateBalanceChangeEntry {
  starkKey: StarkKey
  asset: Asset
  balance: bigint
  change: bigint
  vaultOrPositionId: string
}

export function StateUpdateBalanceChangesTable(
  props: StateUpdateBalanceChangesTableProps
) {
  return (
    <Table
      columns={[
        { header: 'StarkKey' },
        { header: 'Asset' },
        { header: 'Balance', numeric: true },
        { header: 'Change', numeric: true },
        { header: props.type === 'PERPETUAL' ? 'Position' : 'Vault' },
      ]}
      rows={props.balanceChanges.map((entry) => {
        return {
          link: `/users/${entry.starkKey.toString()}`,
          cells: [
            <InlineEllipsis className="max-w-[80px] text-blue-600 underline sm:max-w-[160px]">
              {entry.starkKey.toString()}
            </InlineEllipsis>,
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
