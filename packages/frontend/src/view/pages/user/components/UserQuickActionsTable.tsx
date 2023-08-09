import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { OfferEntry } from '../../../components/tables/OffersTable'
import { FinalizeEscapeForm } from './FinalizeEscapeForm'
import { RegularWithdrawalForm } from './RegularWithdrawalForm'

interface UserQuickActionsTableProps {
  readonly context: PageContext
  readonly escapableAssets: readonly EscapableAssetEntry[]
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly finalizableOffers: readonly FinalizableOfferEntry[]
  readonly starkKey: StarkKey
  readonly exchangeAddress: EthereumAddress
  readonly isMine?: boolean
}

export interface EscapableAssetEntry {
  readonly asset: Asset
  readonly ownerStarkKey: StarkKey
  readonly positionOrVaultId: bigint
  readonly amount: bigint
}

export interface WithdrawableAssetEntry {
  readonly asset: Asset
  readonly amount: bigint
}

export type FinalizableOfferEntry = Omit<OfferEntry, 'status' | 'role'>

export function UserQuickActionsTable(props: UserQuickActionsTableProps) {
  if (
    props.withdrawableAssets.length === 0 &&
    props.escapableAssets.length === 0 &&
    !(
      props.context.tradingMode === 'perpetual' &&
      props.isMine &&
      props.finalizableOffers.length
    )
  ) {
    return null
  }

  return (
    <section className="flex w-full flex-col gap-6 rounded-lg border border-solid border-brand bg-gray-800 p-6">
      {props.withdrawableAssets.length > 0 && <WithdrawableAssets {...props} />}
      {props.escapableAssets.length > 0 && <EscapableAssets {...props} />}
      {props.context.tradingMode === 'perpetual' &&
        props.isMine &&
        props.finalizableOffers.length > 0 && (
          <OffersToFinalize
            finalizableOffers={props.finalizableOffers}
            context={props.context}
          />
        )}
    </section>
  )
}

function EscapableAssets(
  props: Pick<
    UserQuickActionsTableProps,
    'escapableAssets' | 'isMine' | 'context' | 'starkKey' | 'exchangeAddress'
  >
) {
  return (
    <div>
      <p className="text-sm font-semibold text-zinc-500">Pending escapes</p>
      {props.escapableAssets.map((asset) => {
        const assetInfo = assetToInfo(asset.asset)
        return (
          <div className="mt-4 flex items-center gap-2" key={assetInfo.symbol}>
            <AssetWithLogo
              assetInfo={assetInfo}
              type="symbol"
              className="w-48"
            />
            <p className="flex-1 text-zinc-500">
              Finalize the escape of{' '}
              <strong className="text-white">
                {formatAmount(asset.asset, asset.amount)}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {assetInfo.symbol}
                </InlineEllipsis>
              </strong>
            </p>
            {props.isMine &&
              props.context.user &&
              props.context.tradingMode === 'perpetual' && (
                <FinalizeEscapeForm
                  tradingMode={props.context.tradingMode}
                  user={props.context.user}
                  starkKey={props.starkKey}
                  exchangeAddress={props.exchangeAddress}
                  positionId={asset.positionOrVaultId}
                  quantizedAmount={asset.amount}
                />
              )}
            {props.isMine &&
              props.context.user &&
              props.context.tradingMode === 'spot' &&
              asset.asset.details?.assetHash && (
                <FinalizeEscapeForm
                  tradingMode={props.context.tradingMode}
                  user={props.context.user}
                  starkKey={props.starkKey}
                  exchangeAddress={props.exchangeAddress}
                  vaultId={asset.positionOrVaultId}
                  quantizedAmount={asset.amount}
                  assetId={asset.asset.details.assetHash}
                />
              )}
          </div>
        )
      })}
    </div>
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
  props: Pick<UserQuickActionsTableProps, 'finalizableOffers'> & {
    context: PageContext<'perpetual'>
  }
) {
  const collateralAssetInfo = assetToInfo({
    hashOrId: props.context.collateralAsset.assetId,
  })

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
                  { hashOrId: props.context.collateralAsset.assetId },
                  offer.collateralAmount
                )}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {collateralAssetInfo.symbol}
                </InlineEllipsis>
              </strong>
            </p>
            <Button
              as="a"
              href={`/offers/${offer.id}`}
              className="ml-auto w-32 !px-0"
            >
              Go to offer
            </Button>
          </div>
        )
      })}
    </div>
  )
}
