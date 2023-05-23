import { UserDetails } from '@explorer/shared'
import { AssetId } from '@explorer/types'

import { NewPerpetualForcedActionFormProps } from '../../../view/pages/forced-actions/NewForcedActionFormProps'

export interface FormState {
  user: UserDetails
  props: NewPerpetualForcedActionFormProps
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

interface ModifyAmountAction {
  type: 'ModifyAmount'
  value: string
}

interface ModifyPriceAction {
  type: 'ModifyPrice'
  value: string
}

interface ModifyTotalAction {
  type: 'ModifyTotal'
  value: string
}
