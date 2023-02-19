import React from 'react'

import { assetToInfo } from '../../../../utils/assetUtils'
import { formatCurrencyInput } from '../../../../utils/formatUtils'
import { ForcedActionFormProps } from '../../../pages/forced-actions/ForcedActionFormProps'
import { AssetWithLogo } from '../../common/AssetWithLogo'
import { FormId } from './ids'

export function AmountInput(props: ForcedActionFormProps) {
  const assetInfo = assetToInfo(props.selectedAsset)
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
            className="w-full rounded-md bg-transparent text-2xl leading-none outline-none"
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
