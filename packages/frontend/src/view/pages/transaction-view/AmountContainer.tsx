import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import { formatAmount } from '../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../components/AssetWithLogo'

interface AmountContainerProps {
    amount: bigint
    asset: Asset
}

export function AmountContainer(props: AmountContainerProps) {
    const assetInfo = assetToInfo(props.asset)
    return(
        <div className='flex items-center justify-between p-4 bg-slate-800 rounded-lg'>
            <div className='flex flex-col gap-2'>
                <p className='text-zinc-500 font-medium text-sm'>Amount</p>
                <p className='text-white font-semibold text-xl'>{formatAmount(props.asset, props.amount)}</p>
            </div>
            <div className='flex flex-col gap-2'>
                <p className='text-zinc-500 font-medium text-sm'>
                    Tokens
                </p>
                <div className='flex items-center gap-2'>
                    <AssetWithLogo assetInfo={assetInfo} type='symbol' /> //We should merge UserPage before so the symbol type is there
                </div>
            </div>
        </div>
    )
}
