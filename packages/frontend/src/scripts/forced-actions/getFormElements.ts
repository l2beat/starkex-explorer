import { FormId } from '../../view/pages/forced-actions/components/form/ids'

export type FormElements = ReturnType<typeof getFormElements>

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
    amountInput: $<HTMLInputElement>(FormId.AmountInput),
    priceInput: document.getElementById(FormId.PriceInput) as
      | HTMLInputElement
      | undefined,
    totalInput: document.getElementById(FormId.TotalInput) as
      | HTMLInputElement
      | undefined,
    submitButton: $<HTMLButtonElement>(FormId.SubmitButton),
    amountErrorView: $(FormId.AmountErrorView),
  }
}
