import React from 'react'

import { Button } from '../common/Button'
import { OfferEntry } from './OffersTable'

//TODO: Figure out a better name for this component

interface ActionsTableProps {
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly offersToAccept: readonly OfferEntry[]
}

export interface WithdrawableAssetEntry {
  readonly icon: string
  readonly symbol: string
  readonly amount: bigint
}

export function ActionsTable(props: ActionsTableProps) {
  return (
    <div className="mb-12 flex w-full flex-col rounded-lg border border-solid border-dydx-brand-color bg-blue-900 p-6">
      <p className="text-sm font-semibold text-grey-500">Withdrawable assets</p>
      {props.withdrawableAssets.map((asset) => (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex">
            <p>Icon</p>
            <p className="ml-3 text-base font-bold text-white">
              {asset.symbol}
            </p>
          </div>
          <p className="text-base text-grey-500">
            Finalize the withdrawal of{' '}
            <strong className="text-white">
              {asset.amount.toString()} {asset.symbol}
            </strong>
          </p>
          <Button variant="ACTION">Withdraw now</Button>
        </div>
      ))}
      <p className="mt-6 text-sm font-semibold text-grey-500">
        Offers to accept
      </p>
      {props.offersToAccept.map((offer) => {
        const totalPrice = offer.amount * offer.price
        return (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex">
              <p>Icon</p>
              <p className="ml-3 text-base font-bold text-white">
                {offer.asset}
              </p>
            </div>
            <p className="text-base text-grey-500">
              Finalize the offer{' '}
              <strong className="text-white">{offer.amount.toString()}</strong>{' '}
              in exchange for{' '}
              <strong className="text-white">{totalPrice.toString()}</strong>
            </p>
            <Button variant="ACTION">Accept & sell</Button>
          </div>
        )
      })}
    </div>
  )
}
