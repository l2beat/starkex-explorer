import React from 'react'

import { Page } from '../common'
import { AmountInput } from './AmountInput'
import { PositionIdView } from './PositionIdView'
import { PriceInput } from './PriceInput'
import { TotalInput } from './TotalInput'
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
        <PositionIdView positionId={props.positionId} />
        <AmountInput {...props} />
        <PriceInput {...props} />
        <TotalInput />
      </form>
    </Page>
  )
}
