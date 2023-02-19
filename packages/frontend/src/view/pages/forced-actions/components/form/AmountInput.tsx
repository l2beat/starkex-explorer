import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { formatCurrencyInput } from '../../../../../utils/formatting/formatCurrencyInput'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { ForcedActionFormProps } from '../../ForcedActionFormProps'
import { FormId } from './ids'

export function AmountInput(props: ForcedActionFormProps) {
  const assetInfo = assetToInfo({ hashOrId: props.selectedAsset })
  const balance = props.assets.find(
    (asset) => asset.assetId === props.selectedAsset
  )?.balance
  const sign = balance && balance < 0 ? '-' : ''
  const formattedBalance = formatCurrencyInput(balance, props.selectedAsset)

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col">
        <span className="text-sm text-zinc-500">Amount</span>
        <div>
          <input
            id={FormId.AmountInput}
            type="text"
            autoComplete="off"
            placeholder="0.00"
            className="text-2xl w-full rounded-md bg-transparent leading-none outline-none"
          />
        </div>
        <div
          id={FormId.AmountErrorView}
          className="hidden text-sm font-medium text-red-500"
        >
          Amount too large
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm text-zinc-500">
          Balance: {sign}
          {formattedBalance}
        </span>
        <AssetWithLogo assetInfo={assetInfo} />
      </div>
    </div>
  )
}