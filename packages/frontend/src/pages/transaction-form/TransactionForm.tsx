import React from 'react'

import { Page } from '../common'
import { AmountInput } from './AmountInput'
import { FormId } from './ids'
import { InfoText } from './InfoText'
import { PositionIdView } from './PositionIdView'
import { PriceInput } from './PriceInput'
import { TotalInput } from './TotalInput'
import { TransactionFormProps } from './TransactionFormProps'

export function TransactionForm(props: TransactionFormProps) {
  const propsJson = JSON.stringify(props, (k, v) =>
    typeof v === 'bigint' ? v.toString() : v
  )
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
      <div className="w-min mx-auto flex bg-grey-200 drop-shadow-lg rounded-md mb-4">
        <button
          id={FormId.ExitButton}
          className="w-[91px] py-1.5 rounded-md bg-grey-300"
        >
          Exit
        </button>
        <button id={FormId.BuyButton} className="w-[91px] py-1.5 rounded-md">
          Buy
        </button>
        <button id={FormId.SellButton} className="w-[91px] py-1.5 rounded-md">
          Sell
        </button>
      </div>
      <form
        id={FormId.Form}
        className="hidden max-w-[500px] mx-auto bg-grey-200 drop-shadow-lg rounded-md p-4 flex-col gap-2.5"
        data-props={propsJson}
      >
        <div id={FormId.FormTitle} className="text-lg font-medium">
          Forced exit
        </div>
        <PositionIdView positionId={props.positionId} />
        <AmountInput {...props} />
        <PriceInput {...props} />
        <TotalInput />
        <InfoText />
        <button
          id={FormId.SubmitButton}
          type="button"
          className="bg-blue-100 w-full block text-lg font-bold py-2 rounded-md"
        >
          Forced exit
        </button>
      </form>
    </Page>
  )
}
