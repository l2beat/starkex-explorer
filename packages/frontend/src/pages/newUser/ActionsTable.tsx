import React from 'react'

import { Button } from '../common/Button'
import { OfferEntry, WithdrawableAssetEntry } from './UserProps'

//TODO: Figure out a better name for this component

interface ActionsTableProps {
    readonly withdrawableAssets: readonly WithdrawableAssetEntry[]
    readonly offersToAccept: readonly OfferEntry[]
}

export function ActionsTable(props: ActionsTableProps) {
    return(
        <div className='bg-blue-900 p-6 flex flex-col w-full rounded-lg border border-solid border-dydx-brand-color mb-12'>
            <p className='font-semibold text-sm text-grey-500'>Withdrawable assets</p>
            {props.withdrawableAssets.map(asset => 
                <div className='flex items-center justify-between mt-3'>
                    <div className='flex'>
                        <p>Icon</p>
                        <p className='font-bold text-white text-base ml-3'>{asset.symbol}</p>
                    </div>
                    <p className='text-base text-grey-500'>Finalize the withdrawal of <strong className='text-white'>{asset.amount.toString()} {asset.symbol}</strong></p>
                    <Button variant="ACTION">Withdraw now</Button>
                </div>
            )}
            <p className='font-semibold text-sm text-grey-500 mt-6'>Offers to accept</p>
            {props.offersToAccept.map(offer => {
                const totalPrice = offer.amount * offer.price
                return(
                    <div className='flex items-center justify-between mt-3'>
                        <div className='flex'>
                            <p>Icon</p>
                            <p className='font-bold text-white text-base ml-3'>{offer.asset}</p>
                        </div>
                        <p className='text-base text-grey-500'>
                            Finalize the offer <strong className='text-white'>{offer.amount.toString()}</strong> in exchange for <strong className='text-white'>{totalPrice.toString()}</strong>
                        </p>
                        <Button variant="ACTION">Accept & sell</Button>
                    </div>
                )
            })}
        </div>
    )
}
