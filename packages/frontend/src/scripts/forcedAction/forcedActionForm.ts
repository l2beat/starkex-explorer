import { FormId } from '../../view/components/forcedaction/form/ids'
import { ForcedActionFormProps } from '../../view/pages/forcedactions/ForcedActionFormProps'
import { FormElements, getFormElements } from './getFormElements'
import { getInitialState, nextFormState } from './state'
import { submit } from './submit'
import { FormAction, FormState } from './types'

export function initForcedActionForm() {
  if (!document.getElementById(FormId.Form)) {
    return
  }

  const formElements: FormElements = getFormElements()
  const {
    form,
    amountInput,
    priceInput,
    totalInput,
    submitButton,
    amountErrorView,
  } = formElements
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propsJson = JSON.parse(form.dataset.props ?? '{}')
  const props = ForcedActionFormProps.parse(propsJson)

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

  submitButton.addEventListener('click', () => {
    if (!state || !state.canSubmit) {
      throw new Error('Programmer error: Submit button should be disabled')
    }
    submit(state).catch(console.error)
  })

  let state: FormState | undefined
  updateUI(getInitialState(props, location.search))

  function dispatch(action: FormAction) {
    if (state) {
      const newState = nextFormState(state, action)
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
