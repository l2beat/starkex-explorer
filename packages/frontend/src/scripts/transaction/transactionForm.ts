import { AssetId } from '@explorer/types'

import { getAssetImageUrl } from '../../pages/common/icons/getAssetImageUrl'
import { getFormElements } from './getFormElements'
import { jsonToProps } from './jsonToProps'
import { getInitialState, nextFormState } from './state'
import { FormAction, FormState } from './types'
import { formatCurrencyInput } from './utils'

export function initTransactionForm() {
  if (!document.querySelector('#transaction-form')) {
    return
  }

  const ui = getFormElements()
  ui.form.classList.remove('hidden')
  ui.form.classList.add('flex')

  const propsJson = JSON.parse(ui.form.dataset.props ?? '{}')
  const props = jsonToProps(propsJson)

  ui.assetSelect.addEventListener('change', () =>
    dispatch({ type: 'AssetChange', assetId: AssetId(ui.assetSelect.value) })
  )

  ui.exitButton.addEventListener('click', () =>
    dispatch({ type: 'AssetChange', assetId: AssetId.USDC })
  )

  ui.buyButton.addEventListener('click', () =>
    dispatch({ type: 'SwitchToBuy' })
  )

  ui.sellButton.addEventListener('click', () =>
    dispatch({ type: 'SwitchToSell' })
  )

  ui.assetMaxButton.addEventListener('click', () =>
    dispatch({ type: 'UseMaxBalance' })
  )

  ui.suggestedPriceButton.addEventListener('click', () =>
    dispatch({ type: 'UseSuggestedPrice' })
  )

  ui.assetAmountInput.addEventListener('input', () =>
    dispatch({ type: 'ModifyAmount', value: ui.assetAmountInput.value })
  )

  ui.priceInput.addEventListener('input', () =>
    dispatch({ type: 'ModifyPrice', value: ui.priceInput.value })
  )

  ui.totalInput.addEventListener('input', () =>
    dispatch({ type: 'ModifyTotal', value: ui.totalInput.value })
  )

  let state: FormState | undefined
  updateUI(getInitialState(props, location.search))

  function dispatch(action: FormAction) {
    if (state) {
      const newState = nextFormState(state, action)
      updateUI(newState)
    }
  }

  function updateUI(newState: FormState) {
    if (
      !state ||
      state.selectedAsset.assetId !== newState.selectedAsset.assetId
    ) {
      const { assetId, balance, priceUSDCents } = newState.selectedAsset
      ui.assetIconView.setAttribute('src', getAssetImageUrl(assetId))
      ui.assetSymbolView.innerText = AssetId.symbol(assetId).toUpperCase()

      ui.assetBalanceView.innerText = `Balance: ${formatCurrencyInput(
        balance,
        assetId
      )}`
      ui.suggestedPriceView.innerText = `Suggested: ${formatCurrencyInput(
        priceUSDCents * 10000n,
        AssetId.USDC
      )}`

      history.replaceState(
        null,
        '',
        `${location.origin}${location.pathname}?assetId=${assetId}`
      )
    }

    if (ui.assetAmountInput.value !== newState.amountInputString) {
      ui.assetAmountInput.value = newState.amountInputString
    }

    if (ui.priceInput.value !== newState.priceInputString) {
      ui.priceInput.value = newState.priceInputString
    }

    if (ui.totalInput.value !== newState.totalInputString) {
      ui.totalInput.value = newState.totalInputString
    }

    if (!state || state.exitButtonVisible !== newState.exitButtonVisible) {
      ui.exitButton.classList.toggle('hidden', !newState.exitButtonVisible)
    }

    if (!state || state.exitButtonSelected !== newState.exitButtonSelected) {
      ui.exitButton.classList.toggle('bg-grey-300', newState.exitButtonSelected)
    }

    if (!state || state.buyButtonVisible !== newState.buyButtonVisible) {
      ui.buyButton.classList.toggle('hidden', !newState.buyButtonVisible)
    }

    if (!state || state.buyButtonSelected !== newState.buyButtonSelected) {
      ui.buyButton.classList.toggle('bg-grey-300', newState.buyButtonSelected)
    }

    if (!state || state.sellButtonVisible !== newState.sellButtonVisible) {
      ui.sellButton.classList.toggle('hidden', !newState.sellButtonVisible)
    }

    if (!state || state.sellButtonSelected !== newState.sellButtonSelected) {
      ui.sellButton.classList.toggle('bg-grey-300', newState.sellButtonSelected)
    }

    if (!state || state.priceSectionVisible !== newState.priceSectionVisible) {
      ui.priceSection.classList.toggle('hidden', !newState.priceSectionVisible)
    }

    if (!state || state.totalSectionVisible !== newState.totalSectionVisible) {
      ui.totalSection.classList.toggle('hidden', !newState.totalSectionVisible)
    }

    if (!state || state.infoSectionVisible !== newState.infoSectionVisible) {
      ui.infoSection.classList.toggle('hidden', !newState.infoSectionVisible)
    }

    state = newState
  }
}
