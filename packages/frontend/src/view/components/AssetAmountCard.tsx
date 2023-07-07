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
    <div
      className={cx(
        'flex items-center justify-between rounded-lg bg-slate-800 p-4',
        className
      )}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">{amountLabel}</p>
        <p className="text-xl font-semibold text-white">
          {amount !== undefined ? formatAmount(asset, amount) : 'Unknown'}
        </p>
      </div>
      <div>
        <p className="mb-2 text-right text-sm font-medium text-zinc-500">
          {assetLabel}
        </p>
        <div className="flex justify-end gap-2">
          <AssetWithLogo assetInfo={assetInfo} type="symbol" />
        </div>
      </div>
    </div>
  )
}
