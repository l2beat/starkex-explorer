import { AssetId } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../utils/assets'
import { formatCurrencyInput } from '../../../../utils/formatting/formatCurrencyInput'
import { ForcedActionFormProps } from '../../../pages/forced-actions/ForcedActionFormProps'
import { AssetWithLogo } from '../../common/AssetWithLogo'
import { FormId } from './ids'

export function PriceInput(props: ForcedActionFormProps) {
  const usdcInfo = assetToInfo({ hashOrId: AssetId.USDC })
  const assetDetails = props.assets.find(
    (asset) => asset.assetId === props.selectedAsset
  )
  const price = (assetDetails?.priceUSDCents ?? 0n) * 10000n
  const priceFormatted = formatCurrencyInput(price, AssetId.USDC)

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col">
        <span className="text-sm text-zinc-500">Price</span>
        <div>
          <input
            id={FormId.PriceInput}
            type="text"
            autoComplete="off"
            placeholder="0.00"
            className="text-2xl w-full rounded-md bg-transparent leading-none outline-none"
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
        <span className="text-sm text-zinc-500">
          Market price: {priceFormatted}
        </span>
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
