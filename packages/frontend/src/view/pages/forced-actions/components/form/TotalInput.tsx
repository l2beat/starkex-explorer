import { AssetId } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { FormId } from './ids'

export function TotalInput() {
  const usdcInfo = assetToInfo({ hashOrId: AssetId.USDC })

  return (
    <div className="flex gap-2">
      <div className="flex-1 gap-2">
        <span className="text-sm font-medium text-zinc-500">Total</span>
        <input
          id={FormId.TotalInput}
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="w-full rounded-md bg-transparent text-xl font-semibold leading-none outline-none"
        />
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-medium text-zinc-500">Asset</span>
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
