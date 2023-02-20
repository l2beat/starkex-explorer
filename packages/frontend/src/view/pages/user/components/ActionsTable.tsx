import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount, formatWithDecimals } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'
import { Button } from '../../../components/Button'
import { UserOfferEntry } from './UserOffersTable'

//TODO: Figure out a better name for this component

interface ActionsTableProps {
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly offersToAccept: readonly UserOfferEntry[]
}

export interface WithdrawableAssetEntry {
  readonly asset: Asset
  readonly amount: bigint
}

export function ActionsTable(props: ActionsTableProps) {
  return (
    <div className="mb-12 flex w-full flex-col rounded-lg border border-solid border-brand bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Withdrawable assets</p>
      {props.withdrawableAssets.map((asset) => {
        const assetInfo = assetToInfo(asset.asset)
        const symbol = assetInfo.symbol.length > 7 ? `${assetInfo.symbol.substring(0, 7)}...` : assetInfo.symbol
        return (
        <div
          className="mt-4 flex items-center justify-between"
          key={assetInfo.symbol}
        >
          {/* <div className="flex">
            <img src={assetInfo.imageUrl} className="h-8 w-8" data-fallback="/images/unknown-asset.svg" />
            <p className="text-base ml-3 font-bold text-white">
              {symbol}
            </p>
          </div> */}
          <AssetWithLogo assetInfo={assetInfo} type="regularSymbol" />
          <p className="text-base text-zinc-500">
            Finalize the withdrawal of{' '}
            <strong className="text-white">
              {asset.amount.toString()} {symbol}
            </strong>
          </p>
          <Button>Withdraw now</Button>
        </div>
        )
      }
      )}
      <p className="mt-6 text-sm font-semibold text-zinc-500">
        Offers to accept
      </p>
      {props.offersToAccept.map((offer) => {
        const assetInfo = assetToInfo(offer.asset)
        const symbol = assetInfo.symbol.length > 7 ? `${assetInfo.symbol.substring(0, 7)}...` : assetInfo.symbol
        const totalPrice = offer.amount * offer.price
        return (
          <div
            className="mt-3 flex items-center justify-between"
            key={offer.timestamp.toString()}
          >
            {/* <div className="flex items-center">
              <img src={assetInfo.imageUrl} className="h-8 w-8" data-fallback="/images/unknown-asset.svg" />
              <p className="text-base ml-3 font-bold text-white">
                {symbol}
              </p>
            </div> */}
            <AssetWithLogo assetInfo={assetInfo} type="regularSymbol" />
            <p className="text-base text-zinc-500">
              Finalize the offer{' '}
              <strong className="text-white">{formatAmount(offer.asset, offer.amount)} {symbol}</strong>{' '}
              in exchange for{' '}
              <strong className="text-white">{formatWithDecimals(totalPrice, 6, {suffix: ' USDC'})}</strong>
            </p>
            <Button>Accept & sell</Button>
          </div>
        )
      })}
    </div>
  )
}
