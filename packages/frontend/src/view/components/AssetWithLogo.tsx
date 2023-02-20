import cx from 'classnames'
import React from 'react'

import { AssetInfo } from '../../utils/assets'
import { InlineEllipsis } from './InlineEllipsis'

interface AssetWithLogoProps {
  assetInfo: AssetInfo
  type?: 'full' | 'regular' | 'small' | 'regularSymbol' //TODO: Figure out a better name for regularSymbol
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
          (type === 'full' || type === "regularSymbol") && 'h-8 w-8'
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
            <InlineEllipsis className="max-w-[80px] text-xs text-zinc-500 mt-2 !py-0">
              {assetInfo.symbol}
            </InlineEllipsis>
          </div>
        )}
        {type === 'regular' &&
          (assetInfo.isUnknownHash
            ? `${assetInfo.name} (${assetInfo.symbol})`
            : assetInfo.symbol)}
        {(type === 'small' || type === "regularSymbol") && (
          <InlineEllipsis className="max-w-[80px] !py-0">
            {assetInfo.symbol}
          </InlineEllipsis>
        )}
      </span>
    </div>
  )
}
