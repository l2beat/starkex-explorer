import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from './icons/AssetIcon'

export type AssetNameCellProps = {
  assetId: AssetId
}

export function AssetNameCell({ assetId }: AssetNameCellProps) {
  const symbol = AssetId.symbol(assetId)
  return (
    <div className="flex gap-x-1 items-center">
      <AssetIcon assetId={assetId} width="16" height="16" />
      {symbol}
    </div>
  )
}
