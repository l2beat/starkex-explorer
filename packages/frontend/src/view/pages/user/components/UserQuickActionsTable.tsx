import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { OfferEntry } from '../../../components/tables/OffersTable'

interface UserQuickActionsTableProps {
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly offersToAccept: readonly OfferEntry[]
  isMine?: boolean
}

export interface WithdrawableAssetEntry {
  readonly asset: Asset
  readonly amount: bigint
}

export function UserQuickActionsTable(props: UserQuickActionsTableProps) {
  if (
    props.withdrawableAssets.length === 0 &&
    props.offersToAccept.length === 0
  ) {
    return null
  }

  return (
    <section className="flex w-full flex-col rounded-lg border border-solid border-brand bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Withdrawable assets</p>
      {props.withdrawableAssets.map((asset) => {
        const assetInfo = assetToInfo(asset.asset)
        return (
          <div
            className="mt-4 flex items-center justify-between gap-2"
            key={assetInfo.symbol}
          >
            <AssetWithLogo assetInfo={assetInfo} type="symbol" />
            <p className="text-base text-zinc-500">
              Finalize the withdrawal of{' '}
              <strong className="text-white">
                {formatAmount(asset.asset, asset.amount)}{' '}
                <InlineEllipsis className="max-w-[80px]">
                  {assetInfo.symbol}
                </InlineEllipsis>
              </strong>
            </p>
            <Button className="w-32 !px-0">Withdraw now</Button>
          </div>
        )
      })}
      {props.isMine && (
        <>
          <p className="mt-6 text-sm font-semibold text-zinc-500">
            Offers to accept
          </p>
          {props.offersToAccept.map((offer) => {
            const assetInfo = assetToInfo(offer.asset)
            const totalPrice = offer.amount * offer.price
            return (
              <div
                className="mt-3 flex items-center justify-between gap-2"
                key={offer.timestamp.toString()}
              >
                <AssetWithLogo assetInfo={assetInfo} type="symbol" />
                <p className="text-base text-zinc-500">
                  Finalize the offer{' '}
                  <strong className="text-white">
                    {formatAmount(offer.asset, offer.amount)}{' '}
                    <InlineEllipsis className="max-w-[80px]">
                      {assetInfo.symbol}
                    </InlineEllipsis>
                  </strong>{' '}
                  in exchange for{' '}
                  <strong className="text-white">
                    {formatWithDecimals(totalPrice, 6, { suffix: ' USDC' })}
                  </strong>
                </p>
                <Button className="w-32 !px-0">Accept & sell</Button>
              </div>
            )
          })}
        </>
      )}
    </section>
  )
}
