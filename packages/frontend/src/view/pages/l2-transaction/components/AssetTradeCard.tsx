import React from 'react'

import { Asset } from '../../../../utils/assets'
import { HorizontalBidirectionalArrow } from '../../../assets/icons/ArrowIcon'
import { AssetAmountCard } from '../../../components/AssetAmountCard'

interface AssetTradeCardProps {
  synthetic: {
    asset: Asset
    amount: bigint
  }
  collateral: {
    asset: Asset
    amount: bigint
  }
}

export function AssetTradeCard(props: AssetTradeCardProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <AssetAmountCard
        className="flex-1"
        asset={props.synthetic.asset}
        amount={props.synthetic.amount}
      />
      <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800">
        <HorizontalBidirectionalArrow className="fill-zinc-500" />
      </div>
      <AssetAmountCard
        className="flex-1"
        asset={props.collateral.asset}
        amount={props.collateral.amount}
      />
    </div>
  )
}
