import cx from 'classnames'
import React from 'react'
import { AssetInfo } from '../../../static/utils/assetUtils'

interface AssetWithLogoProps {
  type?: 'full' | 'regular' | 'small'
  assetInfo: AssetInfo
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
          type === 'small'
            ? 'h-[20px] w-[20px] rounded-full'
            : 'h-[32px] w-[32px] rounded-full'
        )}
        data-fallback="/images/unknown-asset.svg"
      />
      <span
        className={cx(
          type === 'small'
            ? 'ml-2 text-sm font-medium'
            : 'ml-2 text-lg font-semibold'
        )}
      >
        {type === 'full' ? (
          <div>
            <div>{assetInfo.name}</div>
            <div className="text-xs text-zinc-500 ">{assetInfo.symbol}</div>
          </div>
        ) : assetInfo.isUnknownHash ? (
          `${assetInfo.name} (${assetInfo.symbol})`
        ) : (
          assetInfo.symbol
        )}
      </span>
    </div>
  )
}
