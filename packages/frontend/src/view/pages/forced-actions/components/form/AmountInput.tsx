import React from 'react'
import { assetToInfo } from '../../../../../utils/assets'

import { formatAmount } from '../../../../../utils/formatting/formatAmount'
import { AssetWithLogo } from '../../../../components/AssetWithLogo'
import { NewForcedActionFormProps } from '../../NewForcedActionFormProps'
import { FormId } from './ids'

export function AmountInput(props: NewForcedActionFormProps) {
  const assetInfo = assetToInfo({ hashOrId: props.asset.hashOrId })
  const formattedBalance = formatAmount(
    { hashOrId: props.asset.hashOrId },
    props.asset.balance
  )

  return (
    <div className="flex gap-2">
      <div className="flex flex-1 flex-col gap-2">
        <span className="text-sm font-medium text-zinc-500">Amount</span>
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
        <span className="text-sm font-medium text-zinc-500">
          Balance: {formattedBalance}
        </span>
        <AssetWithLogo assetInfo={assetInfo} />
      </div>
    </div>
  )
}
