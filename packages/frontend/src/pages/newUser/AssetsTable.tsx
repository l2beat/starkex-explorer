import React from 'react'

import { Button } from '../common/Button'
import { NewTable } from '../common/table'
import { AssetEntry } from './UserProps'

export interface AssetsTableProps {
  readonly assets: readonly AssetEntry[]
}

export function AssetsTable({ assets }: AssetsTableProps) {
  return (
    <NewTable
      fullBackground
      pageSize={6}
      id="test"
      title="Assets"
      noRowsText="You have no assets"
      columns={[
        { header: '', className: '!w-9', textAlignClass: 'text-right' },
        { header: 'NAME' },
        { header: 'BALANCE/ID' },
        { header: 'VAULT' },
        {
          header: 'ACTION',
          textAlignClass: 'text-left',
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
            <Button variant="ACTION">{asset.action}</Button>,
          ],
        }
      })}
    />
  )
}
