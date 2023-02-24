import { AssetId } from '@explorer/types'
import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { ForcedActionFormProps } from '../../ForcedActionFormProps'
import { FormId } from './ids'

export function PriceInput(props: ForcedActionFormProps) {
  const usdcInfo = assetToInfo({ hashOrId: AssetId.USDC })
  const assetDetails = props.assets.find(
    (asset) => asset.assetId === props.selectedAsset
  )
  if (!assetDetails) {
    throw new Error('Asset not found')
  }
  const price = assetDetails.priceUSDCents * 10000n
  const priceFormatted = formatAmount({ hashOrId: AssetId.USDC }, price)

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-sm text-zinc-500">Price</span>
        <div>
          <input
            id={FormId.PriceInput}
            type="text"
            autoComplete="off"
            placeholder="0.00"
            className="w-full rounded-md bg-transparent text-xl font-semibold leading-none outline-none"
          />
        </div>
        <div
          id={FormId.AmountErrorView}
          className="hidden font-medium text-red-500"
        >
          Amount too large
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm text-zinc-500">
          Market price: {priceFormatted}
        </span>
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
