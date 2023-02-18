import { AssetId } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../utils/assets'
import { AssetWithLogo } from '../../common/AssetWithLogo'
import { FormId } from './ids'

export function TotalInput() {
  const usdcInfo = assetToInfo({ hashOrId: AssetId.USDC })

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <span className="text-sm text-zinc-500">Total</span>
        <input
          id={FormId.TotalInput}
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="text-2xl w-full rounded-md bg-transparent leading-none outline-none"
        />
      </div>
      <div className="flex flex-col">
        <br />
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
