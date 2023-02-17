import { AssetId } from '@explorer/types'

import { PositionAssetEntry } from '../../../view'
// eslint-disable-next-line no-restricted-imports
import { TransactionFormProps } from '../../../view/old/transaction-form'

export interface FormState {
  props: TransactionFormProps

  selectedAsset: PositionAssetEntry
  amountInputString: string
  amountInputValue: bigint
  amountInputError: boolean
  priceInputString: string
  priceInputValue: bigint
  totalInputString: string
  totalInputValue: bigint
  boundVariable: 'price' | 'total'
  canSubmit: boolean

  exitButtonVisible: boolean
  exitButtonSelected: boolean
  buyButtonVisible: boolean
  buyButtonSelected: boolean
  sellButtonVisible: boolean
  sellButtonSelected: boolean
  priceSectionVisible: boolean
  totalSectionVisible: boolean
  infoSectionVisible: boolean
}

export type FormAction =
  | AssetChangeAction
  | SwitchToBuyAction
  | SwitchToSellAction
  | UseMaxBalanceAction
  | UseSuggestedPriceAction
  | ModifyAmountAction
  | ModifyPriceAction
  | ModifyTotalAction

export interface AssetChangeAction {
  type: 'AssetChange'
  assetId: AssetId
}

export interface SwitchToBuyAction {
  type: 'SwitchToBuy'
}

export interface SwitchToSellAction {
  type: 'SwitchToSell'
}

export interface UseMaxBalanceAction {
  type: 'UseMaxBalance'
}

export interface UseSuggestedPriceAction {
  type: 'UseSuggestedPrice'
}

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
