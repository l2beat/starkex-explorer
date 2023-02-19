import { StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { Table } from '../../../components/table/Table'

export interface UserAssetsTableProps {
  assets: UserAssetEntry[]
  starkKey: StarkKey
  type: 'SPOT' | 'PERPETUAL'
}

export interface UserAssetEntry {
  asset: Asset
  balance: bigint
  value: bigint
  vaultOrPositionId: string
  action: 'WITHDRAW' | 'CLOSE'
}

export function UserAssetsTable(props: UserAssetsTableProps) {
  return (
    <Table
      columns={[
        { header: <span className="pl-10">Name</span> },
        { header: 'Balance' },
        { header: props.type === 'PERPETUAL' ? 'Position' : 'Vault' },
        { header: 'Action' },
      ]}
      rows={props.assets.map((entry) => {
        return {
          cells: [
            <AssetWithLogo type="full" assetInfo={assetToInfo(entry.asset)} />,
            <>
              <div>{formatAmount(entry.asset, entry.balance)}</div>
              <div>{formatWithDecimals(entry.value, 6, { prefix: '$' })}</div>
            </>,
            <span className="text-zinc-500">#{entry.vaultOrPositionId}</span>,
            <Button>{entry.action}</Button>,
          ],
        }
      })}
    />
  )
}
