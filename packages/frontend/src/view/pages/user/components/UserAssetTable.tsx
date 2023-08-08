import { TradingMode } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
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
  action:
    | 'WITHDRAW'
    | 'CLOSE'
    | 'NO-ACTION'
    | 'ESCAPE'
    | 'USE-COLLATERAL-ESCAPE'
}

export function UserAssetsTable(props: UserAssetsTableProps) {
  const isUserRegistered = !!props.ethereumAddress

  const escapeHatchElem = (entry: UserAssetEntry) =>
    entry.action === 'ESCAPE' ? (
      <Button
        as="a"
        href={getEscapeHatchLink(entry.vaultOrPositionId, isUserRegistered)}
      >
        ESCAPE
      </Button>
    ) : entry.action === 'USE-COLLATERAL-ESCAPE' ? (
      <span className="text-zinc-500">use collateral escape</span>
    ) : null

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
                <Button
                  as="a"
                  className="w-32"
                  href={getForcedActionLink(
                    props.tradingMode,
                    entry,
                    isUserRegistered
                  )}
                  disabled={isDisabled}
                >
                  {entry.action}
                </Button>
              ) : (
                escapeHatchElem(entry)
              )),
          ],
        }
      })}
    />
  )
}

function getEscapeHatchLink(
  vaultOrPositionId: string,
  isUserRegistered: boolean
) {
  if (!isUserRegistered) {
    return '/users/register'
  }
  return `/escape/${vaultOrPositionId}`
}

function getForcedActionLink(
  tradingMode: TradingMode,
  entry: UserAssetEntry,
  isUserRegistered: boolean
) {
  if (!isUserRegistered) {
    return '/users/register'
  }

  return tradingMode === 'perpetual'
    ? `/forced/new/${
        entry.vaultOrPositionId
      }/${entry.asset.hashOrId.toString()}`
    : `/forced/new/${entry.vaultOrPositionId}`
}
