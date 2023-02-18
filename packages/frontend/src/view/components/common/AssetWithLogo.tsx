import cx from 'classnames'
import React from 'react'

import { AssetInfo } from '../../../utils/assets'

interface AssetWithLogoProps {
  assetInfo: AssetInfo
  type?: 'full' | 'regular' | 'small'
  className?: string
}

export function AssetWithLogo({
  type = 'regular',
  assetInfo,
  className,
}: AssetWithLogoProps) {
  return (
    <div className={cx('flex items-center', className)}>
      <img
        src={assetInfo.imageUrl}
        className={cx(
          'rounded-full',
          type === 'small' && 'h-[20px] w-[20px]',
          type === 'regular' && 'h-6 w-6',
          type === 'full' && 'h-8 w-8'
        )}
        data-fallback="/images/unknown-asset.svg"
      />
      <span
        className={cx(
          'ml-2',
          type === 'small' ? 'text-sm font-medium' : 'text-lg font-semibold'
        )}
      >
        {type === 'full' && (
          <div>
            <div>{assetInfo.name}</div>
            <div className="text-xs text-zinc-500 ">{assetInfo.symbol}</div>
          </div>
        )}
        {type === 'regular' &&
          (assetInfo.isUnknownHash
            ? `${assetInfo.name} (${assetInfo.symbol})`
            : assetInfo.symbol)}
        {type === 'small' && (
          <span className="inline-block max-w-[8ch] truncate">
            {assetInfo.symbol}
          </span>
        )}
      </span>
    </div>
  )
}
