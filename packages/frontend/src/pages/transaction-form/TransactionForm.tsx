import { AssetId } from '@explorer/types'
import React from 'react'

import { Page } from '../common'
import { AssetIcon } from '../common/icons/AssetIcon'
import { TransactionFormProps } from './TransactionFormProps'

export function TransactionForm(props: TransactionFormProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | Force transaction`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={props.account}
    >
      <div className="w-[273px] mx-auto flex bg-grey-200 drop-shadow-lg rounded-md mb-4">
        <button className="w-[91px] py-1.5 rounded-md bg-grey-300">Exit</button>
        <button className="w-[91px] py-1.5 rounded-md">Buy</button>
        <button className="w-[91px] py-1.5 rounded-md">Sell</button>
      </div>
      <form className="max-w-[500px] mx-auto bg-grey-200 drop-shadow-lg rounded-md p-4 flex flex-col gap-2.5">
        <div className="text-lg font-medium">Forced exit</div>
        <div>Position</div>
        <div className="bg-grey-100 rounded-md p-2 gap-2 flex items-center">
          <span className="text-2xl leading-none font-mono">
            #{props.positionId.toString()}
          </span>
          <span className="px-2 rounded-full bg-blue-100">Owned by you</span>
        </div>
        <label htmlFor="amount">Amount</label>
        <div className="relative">
          <input
            type="text"
            placeholder="0.00"
            className="font-mono text-2xl leading-none bg-grey-100 rounded-md pl-2 pt-2 pr-[100px] pb-8 w-full"
          />
          <div className="absolute top-2 right-2 px-3 py-1 bg-grey-300 flex gap-2 items-center rounded-md">
            <AssetIcon className="w-4 h-4" assetId={AssetId('USDC-6')} />
            <span>USDC</span>
            <svg
              viewBox="0 0 10 5"
              width="10"
              height="5"
              className="fill-white"
            >
              <path d="M0 0L10 0L5 5D" />
            </svg>
            <select className="absolute top-0 left-0 w-full h-full opacity-0 bg-white appearance-none cursor-pointer">
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
          <div className='absolute bottom-2 right-2 w-full flex items-center justify-end'>
            <span>Balance: {props.assets[0].balance.toString()}</span>
            <button className='uppercase bg-grey-300'>Max</button>
          </div>
        </div>
      </form>
    </Page>
  )
}
