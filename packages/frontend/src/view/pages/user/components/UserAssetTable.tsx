import { TradingMode } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { LinkButton } from '../../../components/Button'
import { Table } from '../../../components/table/Table'

interface UserAssetsTableProps {
  assets: UserAssetEntry[]
  starkKey: StarkKey
  ethereumAddress: EthereumAddress | undefined
  tradingMode: TradingMode
  isMine?: boolean
  isFrozen?: boolean
}

export interface UserAssetEntry {
  asset: Asset
  balance: bigint
  value: bigint
  vaultOrPositionId: string
  action: 'WITHDRAW' | 'CLOSE'
}

export function UserAssetsTable(props: UserAssetsTableProps) {
  const forcedActionLink = (entry: UserAssetEntry) =>
    props.ethereumAddress
      ? props.tradingMode === 'perpetual'
        ? `/forced/new/${
            entry.vaultOrPositionId
          }/${entry.asset.hashOrId.toString()}`
        : `/forced/new/${entry.vaultOrPositionId}`
      : '/users/register'

  const escapeHatchElem = (entry: UserAssetEntry) =>
    entry.action === 'WITHDRAW' ? (
      <LinkButton
        href={
          props.ethereumAddress
            ? `/escape/${entry.vaultOrPositionId}`
            : '/users/register'
        }
      >
        ESCAPE
      </LinkButton>
    ) : (
      <span className="text-zinc-500">use collateral escape</span>
    )

  return (
    <Table
      fullBackground
      columns={[
        { header: <span className="pl-10">Name</span> },
        { header: 'Balance' },
        { header: props.tradingMode === 'perpetual' ? 'Position' : 'Vault' },
        ...(props.isMine ? [{ header: 'Action' }] : []),
      ]}
      alignLastColumnRight={true}
      rows={props.assets.map((entry) => {
        const isDisabled = entry.balance <= 0n && entry.action === 'WITHDRAW'
        return {
          cells: [
            <AssetWithLogo type="full" assetInfo={assetToInfo(entry.asset)} />,
            <div className="flex flex-col">
              <span className="text-lg font-medium text-white">
                {formatAmount(entry.asset, entry.balance)}
              </span>
              {props.tradingMode === 'perpetual' && (
                <span className="mt-2 text-xxs text-zinc-500">
                  {formatWithDecimals(entry.value, 2, { prefix: '$' })}
                </span>
              )}
            </div>,
            <span className="text-zinc-500">
              #{entry.vaultOrPositionId}{' '}
              {props.tradingMode === 'spot' && (
                <a href={`/proof/${entry.vaultOrPositionId}`}>(proof)</a>
              )}
            </span>,
            props.isMine &&
              (!props.isFrozen ? (
                <LinkButton
                  className="w-32"
                  href={forcedActionLink(entry)}
                  disabled={isDisabled}
                >
                  {entry.action}
                </LinkButton>
              ) : (
                escapeHatchElem(entry)
              )),
          ],
        }
      })}
    />
  )
}

export function getEscapeHatchLink(
  vaultOrPositionId: string,
  ethereumAddress: EthereumAddress
) {}
