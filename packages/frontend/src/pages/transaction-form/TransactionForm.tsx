import React from 'react'

import { Page } from '../common'
import { AmountInput } from './AmountInput'
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
        <AmountInput {...props} />
      </form>
    </Page>
  )
}
