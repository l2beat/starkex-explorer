import { CollateralAsset } from '@explorer/shared'
import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { NewForcedActionFormAsset } from '../../NewForcedActionFormProps'
import { FormId } from './ids'

interface PriceInputProps {
  collateralAsset: CollateralAsset
  asset: NewForcedActionFormAsset
}

export function PriceInput(props: PriceInputProps) {
  const usdcInfo = assetToInfo({ hashOrId: props.collateralAsset.assetId })
  const price = props.asset.priceUSDCents * 10000n
  const priceFormatted = formatAmount(
    { hashOrId: props.collateralAsset.assetId },
    price
  )

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500">Price</span>
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
        <span className="text-sm font-medium text-zinc-500">
          Market price: {priceFormatted}
        </span>
        <AssetWithLogo assetInfo={usdcInfo} />
      </div>
    </div>
  )
}
