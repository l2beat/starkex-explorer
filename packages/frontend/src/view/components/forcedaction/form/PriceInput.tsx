import { AssetId } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../utils/assetUtils'
import { formatCurrencyInput } from '../../../../utils/formatUtils'
import { ForcedActionFormProps } from '../../../pages/forcedactions/ForcedActionFormProps'
import { AssetWithLogo } from '../../common/AssetWithLogo'
import { FormId } from './ids'

export function PriceInput(props: ForcedActionFormProps) {
  const usdcInfo = assetToInfo(AssetId.USDC)
  const assetDetails = props.assets.find(
    (asset) => asset.assetId === props.selectedAsset
  )
  const price = (assetDetails?.priceUSDCents ?? 0n) * 10000n
  const priceFormatted = formatCurrencyInput(price, AssetId.USDC)

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <span className="text-sm text-zinc-500">Price</span>
        <div>
          <input
            id={FormId.PriceInput}
            type="text"
            autoComplete="off"
            placeholder="0.00"
            className="w-full rounded-md bg-transparent text-2xl leading-none outline-none"
          />
        </div>
        <div
          id={FormId.AmountErrorView}
          className="hidden font-medium text-red-500"
        >
          Amount too large
        </div>
      </div>
      <div className="flex flex-col items-end">
        <label htmlFor="balance" className="text-sm text-zinc-500">
          Market price: {priceFormatted}
        </label>
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
