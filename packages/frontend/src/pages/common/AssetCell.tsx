import { AssetId } from '@explorer/types'
import React from 'react'

import { formatCurrencyUnits } from '../formatting'
import { AssetIcon } from './icons/AssetIcon'

export type AssetCellProps = {
  assetId: AssetId
  amount?: bigint
}

export function AssetCell({ assetId, amount }: AssetCellProps) {
  const symbol = AssetId.symbol(assetId)
  return (
    <div className="flex gap-x-1 items-center w-max">
      <AssetIcon assetId={assetId} width="16" height="16" />
      {amount !== undefined && `${formatCurrencyUnits(amount, assetId)} `}
      {symbol}
    </div>
  )
}
