import { AssetId } from '@explorer/types'

import { NewForcedActionFormProps } from '../../../view/pages/forced-actions/NewForcedActionFormProps'

export interface FormState {
  props: NewForcedActionFormProps
  assetId: AssetId
  balance: bigint
  priceUSDCents: bigint
  amountInputString: string
  amountInputValue: bigint
  amountInputError: boolean
  priceInputString: string
  priceInputValue: bigint
  totalInputString: string
  totalInputValue: bigint
  boundVariable: 'price' | 'total'
  canSubmit: boolean
  type: 'withdraw' | 'buy' | 'sell'
}

export type FormAction =
  | ModifyAmountAction
  | ModifyPriceAction
  | ModifyTotalAction

export interface ModifyAmountAction {
  type: 'ModifyAmount'
  value: string
}

export interface ModifyPriceAction {
  type: 'ModifyPrice'
  value: string
}

export interface ModifyTotalAction {
  type: 'ModifyTotal'
  value: string
}
