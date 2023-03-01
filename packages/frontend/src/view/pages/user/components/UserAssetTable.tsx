import { StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { LinkButton } from '../../../components/Button'
import { Table } from '../../../components/table/Table'

export interface UserAssetsTableProps {
  assets: UserAssetEntry[]
  starkKey: StarkKey
  type: 'SPOT' | 'PERPETUAL'
  isMine?: boolean
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
      fullBackground
      columns={[
        { header: <span className="pl-10">Name</span> },
        { header: 'Balance' },
        { header: props.type === 'PERPETUAL' ? 'Position' : 'Vault' },
        { header: props.isMine ? 'Action' : '' },
      ]}
      rows={props.assets.map((entry) => {
        return {
          cells: [
            <AssetWithLogo type="full" assetInfo={assetToInfo(entry.asset)} />,
            <div className="flex flex-col">
              <span className="text-lg font-medium text-white">
                {formatAmount(entry.asset, entry.balance)}
              </span>
              {props.type === 'PERPETUAL' && (
                <span className="mt-2 text-xxs text-zinc-500">
                  {formatWithDecimals(entry.value, 2, { prefix: '$' })}
                </span>
              )}
            </div>,
            <span className="text-zinc-500">
              #{entry.vaultOrPositionId}
              {props.type === 'SPOT' && (
                <a href={`/proof/${entry.vaultOrPositionId}`}>(proof)</a>
              )}
            </span>,
            props.isMine ? (
              <LinkButton
                className="w-full"
                href={`/forced/new/spot/${entry.vaultOrPositionId}`}
              >
                {entry.action}
              </LinkButton>
            ) : (
              ''
            ),
          ],
        }
      })}
    />
  )
}
