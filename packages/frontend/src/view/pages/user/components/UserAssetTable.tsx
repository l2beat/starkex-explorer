import { assertUnreachable, TradingMode } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { Link } from '../../../components/Link'
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
    | 'NO_ACTION'
    | 'ESCAPE'
    | 'USE_COLLATERAL_ESCAPE'
}

export function UserAssetsTable(props: UserAssetsTableProps) {
  const isUserRegistered = !!props.ethereumAddress

  return (
    <Table
      rowClassName="h-16"
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
            <AssetWithLogo
              type="full"
              assetInfo={assetToInfo(entry.asset)}
              className="min-w-max"
            />,
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
            ...(props.isMine &&
            entry.action !== 'NO_ACTION' &&
            entry.action !== 'USE_COLLATERAL_ESCAPE'
              ? [
                  <Button
                    as="a"
                    href={getActionButtonLink(
                      props.tradingMode,
                      entry,
                      isUserRegistered
                    )}
                    className="w-32"
                    size="sm"
                    disabled={isDisabled}
                  >
                    {getActionButtonLabel(entry.action)}
                  </Button>,
                ]
              : []),
            ...(props.isMine && entry.action === 'USE_COLLATERAL_ESCAPE'
              ? [
                  <span className="text-zinc-500">
                    {getActionButtonLabel(entry.action)}
                  </span>,
                ]
              : []),
          ],
        }
      })}
    />
  )
}

function getActionButtonLabel(action: UserAssetEntry['action']) {
  switch (action) {
    case 'WITHDRAW':
      return 'Withdraw'
    case 'CLOSE':
      return 'Close'
    case 'ESCAPE':
      return 'Escape'
    case 'USE_COLLATERAL_ESCAPE':
      return (
        <span>
          Use{' '}
          <Link href="/tutorials/faqescapehatch#can-i-use-the-escape-hatch-for-all-types-of-assets">
            collateral escape
          </Link>
        </span>
      )
    case 'NO_ACTION':
      throw new Error('No action')
    default:
      assertUnreachable(action)
  }
}

function getActionButtonLink(
  tradingMode: TradingMode,
  entry: UserAssetEntry,
  isUserRegistered: boolean
) {
  if (!isUserRegistered) {
    return '/users/register'
  }

  switch (entry.action) {
    case 'WITHDRAW':
    case 'CLOSE':
      return tradingMode === 'perpetual'
        ? `/forced/new/${
            entry.vaultOrPositionId
          }/${entry.asset.hashOrId.toString()}`
        : `/forced/new/${entry.vaultOrPositionId}`
    case 'ESCAPE':
      return `/escape/${entry.vaultOrPositionId}`
    default:
      return undefined
  }
}
