import cx from 'classnames'
import React from 'react'

import { Asset, assetToInfo } from '../../utils/assets'
import { formatWithDecimals } from '../../utils/formatting/formatAmount'
import { AssetWithLogo } from './AssetWithLogo'

interface AssetPriceCardProps {
  className?: string
  assetLabel?: string
  asset: Asset
  priceLabel?: string
  priceInCents: bigint
}

export function AssetPriceCard({
  className,
  assetLabel = 'Asset',
  asset,
  priceLabel = 'Price',
  priceInCents,
}: AssetPriceCardProps) {
  const assetInfo = assetToInfo(asset)
  return (
    <div
      className={cx(
        'flex items-center justify-between rounded-lg bg-slate-800 p-4',
        className
      )}
    >
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-500">{priceLabel}</p>
        <p className="text-xl font-semibold text-white">
          {formatWithDecimals(priceInCents, 2, { prefix: '$' })}
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
