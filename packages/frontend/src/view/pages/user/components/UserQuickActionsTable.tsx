import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button, LinkButton } from '../../../components/Button'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { OfferEntry } from '../../../components/tables/OffersTable'
import { RegularWithdrawalForm } from './RegularWithdrawalForm'

interface UserQuickActionsTableProps {
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly finalizableOffers: readonly FinalizableOfferEntry[]
  readonly starkKey: StarkKey
  readonly context: PageContext
  readonly exchangeAddress: EthereumAddress
  readonly isMine?: boolean
}

export interface WithdrawableAssetEntry {
  readonly asset: Asset
  readonly amount: bigint
}

export type FinalizableOfferEntry = Omit<OfferEntry, 'status' | 'role'>

export function UserQuickActionsTable(props: UserQuickActionsTableProps) {
  if (
    props.withdrawableAssets.length === 0 &&
    (!props.isMine ||
      props.context.tradingMode !== 'perpetual' ||
      props.finalizableOffers.length === 0)
  ) {
    return null
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-lg border border-solid border-brand bg-gray-800 p-6">
      {props.withdrawableAssets.length > 0 && <WithdrawableAssets {...props} />}
      {props.context.tradingMode === 'perpetual' &&
        props.isMine &&
        props.finalizableOffers.length > 0 && <OffersToFinalize {...props} />}
    </section>
  )
}

function WithdrawableAssets(
  props: Pick<
    UserQuickActionsTableProps,
    'withdrawableAssets' | 'isMine' | 'context' | 'starkKey' | 'exchangeAddress'
  >
) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-500">Withdrawable assets</p>
      {props.withdrawableAssets.map((asset) => {
        const assetInfo = assetToInfo(asset.asset)
        return (
          <div className="mt-4 flex items-center gap-2" key={assetInfo.symbol}>
            <AssetWithLogo
              assetInfo={assetInfo}
              type="symbol"
              className="w-48"
            />
            <p className="flex-1 text-zinc-500">
              Finalize the withdrawal of{' '}
              <strong className="text-white">
                {formatAmount(asset.asset, asset.amount)}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {assetInfo.symbol}
                </InlineEllipsis>
              </strong>
            </p>
            {props.isMine && props.context.user && asset.asset.details && (
              <RegularWithdrawalForm
                assetDetails={asset.asset.details}
                account={props.context.user.address}
                starkKey={props.starkKey}
                exchangeAddress={props.exchangeAddress}
              >
                <Button className="ml-auto w-32 !px-0">Withdraw now</Button>
              </RegularWithdrawalForm>
            )}
          </div>
        )
      })}
    </div>
  )
}

function OffersToFinalize(
  props: Pick<UserQuickActionsTableProps, 'finalizableOffers' | 'context'>
) {
  if (props.context.tradingMode !== 'perpetual') {
    return null
  }

  const collateralAsset = props.context.collateralAsset
  const collateralAssetInfo = assetToInfo({ hashOrId: collateralAsset.assetId })

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-500">Offers to finalize</p>
      {props.finalizableOffers.map((offer) => {
        const syntheticAssetInfo = assetToInfo(offer.syntheticAsset)
        return (
          <div
            className="mt-3 flex items-center gap-2"
            key={offer.timestamp.toString()}
          >
            <AssetWithLogo
              assetInfo={syntheticAssetInfo}
              type="symbol"
              className="w-48"
            />
            <p className="flex-1 text-zinc-500">
              Finalize the offer{' '}
              <strong className="text-white">
                {formatAmount(offer.syntheticAsset, offer.syntheticAmount)}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {syntheticAssetInfo.symbol}
                </InlineEllipsis>
              </strong>{' '}
              in exchange for{' '}
              <strong className="text-white">
                {formatAmount(
                  { hashOrId: collateralAsset.assetId },
                  offer.collateralAmount
                )}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {collateralAssetInfo.symbol}
                </InlineEllipsis>
              </strong>
            </p>
            <LinkButton
              href={`/offers/${offer.id}`}
              className="ml-auto w-32 !px-0"
            >
              Go to offer
            </LinkButton>
          </div>
        )
      })}
    </div>
  )
}
