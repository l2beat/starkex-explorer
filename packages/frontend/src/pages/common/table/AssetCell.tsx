import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../icons/AssetIcon'

export type AssetCellProps = {
  assetId: AssetId
}

export function AssetCell({ assetId }: AssetCellProps) {
  const symbol = AssetId.symbol(assetId)
  return (
    <div className="flex gap-x-1 items-center w-max">
      <AssetIcon assetId={assetId} width="16" height="16" />
      {symbol}
    </div>
  )
}
