import { FormId } from '../../../view/old/transaction-form/ids'

export function getFormElements() {
  function $<T extends HTMLElement>(id: string) {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`Cannot find #${id}`)
    }
    return element as T
  }

  return {
    form: $<HTMLFormElement>(FormId.Form),
    formTitle: $(FormId.FormTitle),
    assetSelect: $<HTMLSelectElement>(FormId.AssetSelect),
    assetAmountInput: $<HTMLInputElement>(FormId.AssetAmountInput),
    amountErrorView: $(FormId.AmountErrorView),
    assetMaxButton: $<HTMLSelectElement>(FormId.AssetMaxButton),
    assetBalanceView: $<HTMLSelectElement>(FormId.AssetBalanceView),
    assetIconView: $<HTMLImageElement>(FormId.AssetIconView),
    assetSymbolView: $(FormId.AssetSymbolView),
    priceSection: $(FormId.PriceSection),
    priceInput: $<HTMLInputElement>(FormId.PriceInput),
    suggestedPriceView: $(FormId.SuggestedPriceView),
    suggestedPriceButton: $<HTMLButtonElement>(FormId.SuggestedPriceButton),
    totalSection: $(FormId.TotalSection),
    totalInput: $<HTMLInputElement>(FormId.TotalInput),
    submitButton: $<HTMLButtonElement>(FormId.SubmitButton),
    exitButton: $<HTMLButtonElement>(FormId.ExitButton),
    buyButton: $<HTMLButtonElement>(FormId.BuyButton),
    sellButton: $<HTMLButtonElement>(FormId.SellButton),
    infoSection: $(FormId.InfoSection),
  }
}
