import cx from 'classnames'
import React from 'react'

import { Asset, assetToInfo } from '../../utils/assets'
import { formatAmount } from '../../utils/formatting/formatAmount'
import { AssetWithLogo } from './AssetWithLogo'

interface AssetAmountCardProps {
  className?: string
  assetLabel?: string
  asset: Asset
  amountLabel?: string
  amount?: bigint
}

export function AssetAmountCard({
  className,
  assetLabel = 'Asset',
  asset,
  amountLabel = 'Amount',
  amount,
}: AssetAmountCardProps) {
  const assetInfo = assetToInfo(asset)
  return (
    <div className="@container">
      <div
        className={cx(
          'flex flex-col justify-between gap-3 rounded-lg bg-slate-800 p-4 @[300px]:flex-row',
          className
        )}
      >
        <div className="flex flex-col justify-between">
          <p className="mb-2 text-sm font-medium text-zinc-500">
            {amountLabel}
          </p>
          <p className="text-xl font-semibold text-white">
            {amount !== undefined ? formatAmount(asset, amount) : 'Unknown'}
          </p>
        </div>
        <div className="flex flex-col justify-between">
          <p className="mb-2 text-sm font-medium text-zinc-500 @[300px]:text-right">
            {assetLabel}
          </p>
          <div className="flex gap-2 @[300px]:justify-end">
            <AssetWithLogo assetInfo={assetInfo} type="symbol" />
          </div>
        </div>
      </div>
    </div>
  )
}
