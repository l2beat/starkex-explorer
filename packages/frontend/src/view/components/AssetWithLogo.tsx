import classNames from 'classnames'
import React from 'react'

import { AssetInfo } from '../../utils/assets'
import { InlineEllipsis } from './InlineEllipsis'

interface AssetWithLogoProps {
  assetInfo: AssetInfo
  type?: 'full' | 'regular' | 'small' | 'symbol'
  className?: string
  symbolClassName?: string
}

export function AssetWithLogo({
  type = 'regular',
  assetInfo,
  className,
  symbolClassName,
}: AssetWithLogoProps) {
  return (
    <div className={classNames('flex items-center', className)}>
      <img
        data-src={assetInfo.imageUrl}
        className={classNames(
          'rounded-full',
          type === 'small' && 'h-[20px] w-[20px]',
          type === 'regular' && 'h-6 w-6',
          (type === 'full' || type === 'symbol') && 'h-8 w-8'
        )}
        data-fallback="/images/unknown-asset.svg"
      />
      <span
        className={classNames(
          type === 'small'
            ? 'ml-1 text-sm font-medium'
            : 'ml-2 text-lg font-semibold'
        )}
      >
        {type === 'full' && (
          <div>
            <div>{assetInfo.name}</div>
            <InlineEllipsis
              className={classNames(
                'mt-2 max-w-[80px] !py-0 text-xs text-zinc-500',
                symbolClassName
              )}
            >
              {assetInfo.symbol}
            </InlineEllipsis>
          </div>
        )}
        {type === 'regular' &&
          (assetInfo.isUnknownHash ? (
            <div>
              <div>{assetInfo.name}</div>
              <InlineEllipsis
                className={classNames('max-w-[100px] !py-0', symbolClassName)}
              >
                {assetInfo.symbol}
              </InlineEllipsis>
            </div>
          ) : (
            assetInfo.symbol
          ))}
        {(type === 'small' || type === 'symbol') && (
          <InlineEllipsis
            className={classNames('max-w-[160px] !py-0', symbolClassName)}
          >
            {assetInfo.symbol}
          </InlineEllipsis>
        )}
      </span>
    </div>
  )
}
