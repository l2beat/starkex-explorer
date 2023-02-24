import React from 'react'

import { assetToInfo } from '../../../../../utils/assets'
import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { ForcedActionFormProps } from '../../ForcedActionFormProps'
import { FormId } from './ids'

export function AmountInput(props: ForcedActionFormProps) {
  const assetInfo = assetToInfo({ hashOrId: props.selectedAsset })
  const asset = props.assets.find(
    (asset) => asset.assetId === props.selectedAsset
  )
  if (!asset) {
    throw new Error('Asset not found')
  }
  const formattedBalance = formatAmount(
    { hashOrId: props.selectedAsset },
    asset.balance
  )

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-sm text-zinc-500">Amount</span>
        <div>
          <input
            id={FormId.AmountInput}
            type="text"
            autoComplete="off"
            placeholder="0.00"
            className="w-full rounded-md bg-transparent text-xl font-semibold leading-none outline-none"
          />
        </div>
        <div
          id={FormId.AmountErrorView}
          className="hidden text-sm font-medium text-red-500"
        >
          Amount too large
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm text-zinc-500">
          Balance: {formattedBalance}
        </span>
        <AssetWithLogo assetInfo={assetInfo} />
      </div>
    </div>
  )
}
