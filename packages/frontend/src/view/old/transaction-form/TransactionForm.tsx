import React from 'react'

import { Page } from '../common/page/Page'
import { AmountInput } from './AmountInput'
import { FormId } from './ids'
import { InfoText } from './InfoText'
import { PositionIdView } from './PositionIdView'
import { PriceInput } from './PriceInput'
import { TotalInput } from './TotalInput'
import {
  serializeTransactionFormProps,
  TransactionFormProps,
} from './TransactionFormProps'

export function TransactionForm(props: TransactionFormProps) {
  const propsJson = serializeTransactionFormProps(props)
  return (
    <>
      <div className="wide:px-4 flex items-center justify-center bg-yellow-100 px-2 py-1 text-gray-100">
        <span>
          <strong>WARNING:</strong> The Forced Exit is missing some
          functionality temporarily. We are working on fixing it.
        </span>
      </div>
      <Page title="" path="/" description="" account={props.account}>
        <div className="mx-auto mb-4 flex w-min rounded-md bg-gray-200 drop-shadow-lg">
          <button
            id={FormId.ExitButton}
            className="w-[91px] rounded-md bg-gray-300 py-1.5"
          >
            Exit
          </button>
          <button id={FormId.BuyButton} className="w-[91px] rounded-md py-1.5">
            Buy
          </button>
          <button id={FormId.SellButton} className="w-[91px] rounded-md py-1.5">
            Sell
          </button>
        </div>
        <form
          id={FormId.Form}
          className="mx-auto hidden max-w-[500px] flex-col gap-2.5 rounded-md bg-gray-200 p-4 drop-shadow-lg"
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
            className="block w-full rounded-md bg-blue-100 py-2 text-lg font-bold"
          >
            Forced exit
          </button>
        </form>
      </Page>
    </>
  )
}
