import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetIcon } from '../common/icons/AssetIcon'
import { FormId } from './ids'
import { TransactionFormProps } from './TransactionFormProps'

export function AmountInput(props: TransactionFormProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="amount">Amount</label>
      <div className="relative">
        <input
          id={FormId.AssetAmountInput}
          type="text"
          autoComplete="off"
          placeholder="0.00"
          className="font-mono text-2xl leading-none bg-grey-100 rounded-md pl-2 pt-2 pr-[120px] pb-10 w-full"
        />
        <div className="absolute top-2 right-2 px-3 py-0.5 bg-grey-300 flex gap-2 items-center rounded-md">
          <AssetIcon
            id={FormId.AssetIconView}
            className="w-4 h-4"
            assetId={AssetId.USDC}
          />
          <span id={FormId.AssetSymbolView}>USDC</span>
          <svg viewBox="0 0 10 5" width="10" height="5" className="fill-white">
            <path d="M0 0L10 0L5 5D" />
          </svg>
          <select
            id={FormId.AssetSelect}
            className="absolute top-0 left-0 w-full h-full opacity-0 bg-white appearance-none cursor-pointer"
          >
            {props.assets.map((asset) => (
              <option
                key={asset.assetId.toString()}
                value={asset.assetId.toString()}
              >
                {AssetId.symbol(asset.assetId)}
              </option>
            ))}
          </select>
        </div>
        <div className="absolute bottom-2 right-2 w-full flex items-center justify-end gap-2">
          <span
            id={FormId.AssetBalanceView}
            className="font-mono text-grey-400"
          >
            Balance: {props.assets[0]?.balance.toString() ?? 0}
          </span>
          <button
            id={FormId.AssetMaxButton}
            type="button"
            className="uppercase bg-grey-300 px-2 py-0.5 text-xs rounded-md"
          >
            Max
          </button>
        </div>
      </div>
      <div
        id={FormId.AmountErrorView}
        className="hidden text-red-100 font-medium"
      >
        Amount too large
      </div>
    </div>
  )
}
