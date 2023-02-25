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
          className="bg-gray-100 font-mono text-2xl w-full rounded-md pl-2 pt-2 pr-[120px] pb-10 leading-none"
        />
        <div className="bg-gray-300 absolute top-2 right-2 flex items-center gap-2 rounded-md px-3 py-0.5">
          <AssetIcon
            id={FormId.AssetIconView}
            className="h-4 w-4"
            assetId={AssetId.USDC}
          />
          <span id={FormId.AssetSymbolView}>USDC</span>
          <svg viewBox="0 0 10 5" width="10" height="5" className="fill-white">
            <path d="M0 0L10 0L5 5D" />
          </svg>
          <select
            id={FormId.AssetSelect}
            className="absolute top-0 left-0 h-full w-full cursor-pointer appearance-none bg-white opacity-0"
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
        <div className="absolute bottom-2 right-2 flex w-full items-center justify-end gap-2">
          <span
            id={FormId.AssetBalanceView}
            className="text-gray-400 font-mono"
          >
            Balance: {props.assets[0]?.balance.toString() ?? 0}
          </span>
          <button
            id={FormId.AssetMaxButton}
            type="button"
            className="bg-gray-300 rounded-md px-2 py-0.5 text-xs uppercase"
          >
            Max
          </button>
        </div>
      </div>
      <div
        id={FormId.AmountErrorView}
        className="text-red-400 hidden font-medium"
      >
        Amount too large
      </div>
    </div>
  )
}
