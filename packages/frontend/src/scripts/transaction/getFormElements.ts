export function getFormElements() {
  function $<T extends Element>(query: string) {
    const element = document.querySelector<T>(query)
    if (!element) {
      throw new Error(`Cannot find ${query}`)
    }
    return element
  }

  return {
    form: $<HTMLFormElement>('#transaction-form'),
    assetSelect: $<HTMLSelectElement>('#asset-select'),
    assetAmountInput: $<HTMLSelectElement>('#asset-amount'),
    assetMaxButton: $<HTMLSelectElement>('#asset-max'),
    assetBalanceView: $<HTMLSelectElement>('#asset-balance'),
    assetIconView: $<HTMLImageElement>('#asset-icon'),
    assetSymbolView: $<HTMLImageElement>('#asset-symbol'),
    priceSection: $<HTMLDivElement>('#price-section'),
    priceInput: $<HTMLInputElement>('#price'),
    suggestedPriceButton: $<HTMLInputElement>('#suggested-price'),
    totalSection: $<HTMLDivElement>('#total-section'),
    totalInput: $<HTMLInputElement>('#total'),
    submitButton: $<HTMLButtonElement>('#submit'),
    exitButton: $<HTMLButtonElement>('#exit-button'),
    buyButton: $<HTMLButtonElement>('#buy-button'),
    sellButton: $<HTMLButtonElement>('#sell-button'),
    infoSection: $<HTMLDivElement>('#info-section'),
  }
}
