import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../common/icons/AssetIcon'
import { FormId } from './ids'

export function TotalInput() {
  return (
    <div id={FormId.TotalSection} className="flex flex-col gap-1">
      <label htmlFor="total">Total</label>
      <div className="relative">
        <input
          id={FormId.TotalInput}
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="bg-gray-100 font-mono text-2xl w-full rounded-md py-2 pl-2 pr-[80px] leading-none"
        />
        <div className="absolute top-2 right-2 flex items-center gap-2 py-0.5">
          <AssetIcon className="h-4 w-4" assetId={AssetId.USDC} />
          <span>USDC</span>
        </div>
      </div>
    </div>
  )
}
