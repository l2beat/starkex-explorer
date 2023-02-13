import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../common/icons/AssetIcon'
import { FormId } from './ids'
import { TransactionFormProps } from './TransactionFormProps'

export function PriceInput(props: TransactionFormProps) {
  return (
    <div id={FormId.PriceSection} className="flex flex-col gap-1">
      <label htmlFor="price">Price</label>
      <div className="relative">
        <input
          id={FormId.PriceInput}
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="bg-gray-100 font-mono w-full rounded-md pl-2 pt-2 pr-[80px] pb-10 text-2xl leading-none"
        />
        <div className="absolute top-2 right-2 flex items-center gap-2 py-0.5">
          <AssetIcon className="h-4 w-4" assetId={AssetId.USDC} />
          <span>USDC</span>
        </div>
        <div className="absolute bottom-2 right-2 flex w-full items-center justify-end gap-2">
          <span
            id={FormId.SuggestedPriceView}
            className="font-mono text-gray-400"
          >
            Suggested: {props.assets[0]?.priceUSDCents.toString() ?? 0}
          </span>
          <button
            id={FormId.SuggestedPriceButton}
            type="button"
            className="bg-gray-300 rounded-md px-2 py-0.5 text-xs uppercase"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
