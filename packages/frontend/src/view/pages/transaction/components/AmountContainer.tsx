import React from 'react'

import { Asset, assetToInfo } from '../../../../utils/assets'
import { formatAmount } from '../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../components/AssetWithLogo'

interface AmountContainerProps {
  amount: bigint
  asset: Asset
}

export function AmountContainer(props: AmountContainerProps) {
  const assetInfo = assetToInfo(props.asset)
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-800 p-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500">Amount</p>
        <p className="text-xl font-semibold text-white">
          {formatAmount(props.asset, props.amount)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500">Tokens</p>
        <div className="flex items-center gap-2">
          <AssetWithLogo assetInfo={assetInfo} type="symbol" /> //We should
          merge UserPage before so the symbol type is there
        </div>
      </div>
    </div>
  )
}
