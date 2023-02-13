import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../icons/AssetIcon'

export interface AssetCellProps {
  assetId: AssetId
}

export function AssetCell({ assetId }: AssetCellProps) {
  const symbol = AssetId.symbol(assetId)
  return (
    <div className="flex w-max items-center gap-x-1">
      <AssetIcon assetId={assetId} width="16" height="16" />
      {symbol}
    </div>
  )
}
