export function getFormElements() {
  function $<T extends HTMLElement>(query: string) {
    const element = document.querySelector<T>(query)
    if (!element) {
      throw new Error(`Cannot find ${query}`)
    }
    return element
  }

  return {
    form: $<HTMLFormElement>('#transaction-form'),
    formTitle: $('#form-title'),
    assetSelect: $<HTMLSelectElement>('#asset-select'),
    assetAmountInput: $<HTMLInputElement>('#asset-amount'),
    amountErrorView: $('#amount-error'),
    assetMaxButton: $<HTMLSelectElement>('#asset-max'),
    assetBalanceView: $<HTMLSelectElement>('#asset-balance'),
    assetIconView: $<HTMLImageElement>('#asset-icon'),
    assetSymbolView: $('#asset-symbol'),
    priceSection: $('#price-section'),
    priceInput: $<HTMLInputElement>('#price'),
    suggestedPriceView: $('#asset-price'),
    suggestedPriceButton: $<HTMLButtonElement>('#suggested-price'),
    totalSection: $('#total-section'),
    totalInput: $<HTMLInputElement>('#total'),
    submitButton: $<HTMLButtonElement>('#submit'),
    exitButton: $<HTMLButtonElement>('#exit-button'),
    buyButton: $<HTMLButtonElement>('#buy-button'),
    sellButton: $<HTMLButtonElement>('#sell-button'),
    infoSection: $('#info-section'),
  }
}
