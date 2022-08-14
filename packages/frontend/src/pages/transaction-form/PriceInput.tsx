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
          className="font-mono text-2xl leading-none bg-grey-100 rounded-md pl-2 pt-2 pr-[80px] pb-10 w-full"
        />
        <div className="absolute top-2 right-2 py-0.5 flex gap-2 items-center">
          <AssetIcon className="w-4 h-4" assetId={AssetId.USDC} />
          <span>USDC</span>
        </div>
        <div className="absolute bottom-2 right-2 w-full flex items-center justify-end gap-2">
          <span
            id={FormId.SuggestedPriceView}
            className="font-mono text-grey-400"
          >
            Suggested: {props.assets[0]?.priceUSDCents.toString() ?? 0}
          </span>
          <button
            id={FormId.SuggestedPriceButton}
            type="button"
            className="uppercase bg-grey-300 px-2 py-0.5 text-xs rounded-md"
          >
            Use
          </button>
        </div>
      </div>
    </div>
  )
}
