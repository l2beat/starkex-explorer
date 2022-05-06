import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../common/icons/AssetIcon'

export function TotalInput() {
  return (
    <div id="total-section" className="flex flex-col gap-1">
      <label htmlFor="total">Total</label>
      <div className="relative">
        <input
          id="total"
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="font-mono text-2xl leading-none bg-grey-100 rounded-md pl-2 py-2 pr-[80px] w-full"
        />
        <div className="absolute top-2 right-2 py-0.5 flex gap-2 items-center">
          <AssetIcon className="w-4 h-4" assetId={AssetId.USDC} />
          <span>USDC</span>
        </div>
      </div>
    </div>
  )
}
