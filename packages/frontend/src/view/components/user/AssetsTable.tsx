import React from 'react'

import { Button } from '../common/Button'
import { Table } from '../common/table/Table'

export interface AssetsTableProps {
  readonly assets: readonly AssetEntry[]
}

export interface AssetEntry {
  readonly icon: string
  readonly name: string
  readonly symbol: string
  readonly balance: bigint
  readonly value: bigint
  readonly vaultId: number
  readonly action: 'WITHDRAW' | 'CLOSE'
}

export function AssetsTable({ assets }: AssetsTableProps) {
  return (
    <Table
      columns={[
        { header: '', className: '!w-9' },
        { header: 'NAME' },
        { header: 'BALANCE/ID' },
        { header: 'VAULT' },
        {
          header: 'ACTION',
          className: '!w-[130px]',
        },
      ]}
      rows={assets.map((asset) => {
        const link = `/assets/${asset.name}` //TODO: Construct a proper link
        return {
          link,
          cells: [
            asset.icon,
            asset.name,
            asset.balance.toString(),
            asset.vaultId,
            <Button>{asset.action}</Button>,
          ],
        }
      })}
    />
  )
}
