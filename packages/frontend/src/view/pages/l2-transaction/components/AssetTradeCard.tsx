import React from 'react'

import { Asset } from '../../../../utils/assets'
import { HorizontalBidirectionalArrow } from '../../../assets/icons/ArrowIcon'
import { AssetAmountCard } from '../../../components/AssetAmountCard'

interface AssetTradeCardProps {
  left: {
    asset: Asset
    amount: bigint
    assetLabel?: string
    amountLabel?: string
  }
  right: {
    asset: Asset
    amount: bigint
    assetLabel?: string
    amountLabel?: string
  }
}

export function AssetTradeCard(props: AssetTradeCardProps) {
  return (
    <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
      <AssetAmountCard asset={props.left.asset} amount={props.left.amount} />
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-slate-800">
        <HorizontalBidirectionalArrow className="rotate-90 fill-zinc-500 sm:rotate-0" />
      </div>
      <AssetAmountCard asset={props.right.asset} amount={props.right.amount} />
    </div>
  )
}
