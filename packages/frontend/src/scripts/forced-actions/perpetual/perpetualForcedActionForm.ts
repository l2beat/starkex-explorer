import { CollateralAsset, UserDetails } from '@explorer/shared'

import { FormId } from '../../../view/pages/forced-actions/components/form/ids'
import { NewForcedActionFormProps } from '../../../view/pages/forced-actions/NewForcedActionFormProps'
import { makeQuery } from '../../utils/query'
import { getFormElements } from './getFormElements'
import { getInitialState, nextFormState } from './state'
import { submit } from './submit'
import { FormAction, FormState } from './types'

export function initPerpetualForcedActionForm() {
  const { $ } = makeQuery(document.body)

  if (!$.maybe(`#${FormId.Form}`)) {
    return
  }

  const {
    form,
    amountInput,
    priceInput,
    totalInput,
    submitButton,
    amountErrorView,
  } = getFormElements()

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = NewForcedActionFormProps.parse(propsJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const userJson = JSON.parse(form.dataset.user ?? '{}')
  const user = UserDetails.parse(userJson)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const collateralAssetJson = JSON.parse(form.dataset.collateralAsset ?? '{}')
  const collateralAsset = CollateralAsset.parse(collateralAssetJson)

  amountInput.addEventListener('input', () =>
    dispatch({ type: 'ModifyAmount', value: amountInput.value })
  )

  if (priceInput) {
    priceInput.addEventListener('input', () =>
      dispatch({ type: 'ModifyPrice', value: priceInput.value })
    )
  }

  if (totalInput) {
    totalInput.addEventListener('input', () =>
      dispatch({ type: 'ModifyTotal', value: totalInput.value })
    )
  }

  submitButton.addEventListener('click', (e) => {
    e.preventDefault()
    if (!state || !state.canSubmit) {
      throw new Error('Programmer error: Submit button should be disabled')
    }
    submit(state).catch(console.error)
  })

  let state: FormState | undefined
  updateUI(getInitialState(props, user, collateralAsset))

  function dispatch(action: FormAction) {
    if (state) {
      const newState = nextFormState(state, action)
      console.log(newState)
      updateUI(newState)
    }
  }

  function updateUI(newState: FormState) {
    if (amountInput.value !== newState.amountInputString) {
      amountInput.value = newState.amountInputString
    }

    if (!state || state.amountInputError !== newState.amountInputError) {
      amountErrorView.classList.toggle('hidden', !newState.amountInputError)
      amountInput.classList.toggle('text-red-500', newState.amountInputError)
    }

    if (
      priceInput &&
      newState.priceInputString &&
      priceInput.value !== newState.priceInputString
    ) {
      priceInput.value = newState.priceInputString
    }

    if (
      totalInput &&
      newState.totalInputString &&
      totalInput.value !== newState.totalInputString
    ) {
      totalInput.value = newState.totalInputString
    }

    if (!state || state.canSubmit !== newState.canSubmit) {
      if (!newState.canSubmit) {
        submitButton.setAttribute('disabled', '')
      } else {
        submitButton.removeAttribute('disabled')
      }
    }

    state = newState
  }
}
