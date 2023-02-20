import React from 'react'

import { Button } from '../../../components/Button'
import { UserOfferEntry } from './UserOffersTable'

//TODO: Figure out a better name for this component

interface ActionsTableProps {
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
  readonly offersToAccept: readonly UserOfferEntry[]
}

export interface WithdrawableAssetEntry {
  readonly icon: string
  readonly symbol: string
  readonly amount: bigint
}

export function ActionsTable(props: ActionsTableProps) {
  return (
    <div className="mb-12 flex w-full flex-col rounded-lg border border-solid border-brand bg-gray-800 p-6">
      <p className="text-sm font-semibold text-zinc-500">Withdrawable assets</p>
      {props.withdrawableAssets.map((asset) => (
        <div
          className="mt-3 flex items-center justify-between"
          key={asset.symbol}
        >
          <div className="flex">
            <p>Icon</p>
            <p className="text-base ml-3 font-bold text-white">
              {asset.symbol}
            </p>
          </div>
          <p className="text-base text-zinc-500">
            Finalize the withdrawal of{' '}
            <strong className="text-white">
              {asset.amount.toString()} {asset.symbol}
            </strong>
          </p>
          <Button>Withdraw now</Button>
        </div>
      ))}
      <p className="mt-6 text-sm font-semibold text-zinc-500">
        Offers to accept
      </p>
      {props.offersToAccept.map((offer) => {
        const totalPrice = offer.amount * offer.price
        return (
          <div
            className="mt-3 flex items-center justify-between"
            key={offer.timestamp.toString()}
          >
            <div className="flex">
              <p>Icon</p>
              <p className="text-base ml-3 font-bold text-white">
                {/* {offer.asset} */}
              </p>
            </div>
            <p className="text-base text-zinc-500">
              Finalize the offer{' '}
              <strong className="text-white">{offer.amount.toString()}</strong>{' '}
              in exchange for{' '}
              <strong className="text-white">{totalPrice.toString()}</strong>
            </p>
            <Button>Accept & sell</Button>
          </div>
        )
      })}
    </div>
  )
}
