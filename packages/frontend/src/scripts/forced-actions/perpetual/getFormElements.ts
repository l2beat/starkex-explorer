import { FormId } from '../../../view/pages/forced-actions/components/form/ids'
import { makeQuery } from '../../utils/query'

export type FormElements = ReturnType<typeof getFormElements>

export function getFormElements() {
  const { $ } = makeQuery(document.body)

  return {
    form: $<HTMLFormElement>(`#${FormId.Form}`),
    amountInput: $<HTMLInputElement>(`#${FormId.AmountInput}`),
    priceInput: document.getElementById(`#${FormId.PriceInput}`) as
      | HTMLInputElement
      | undefined,
    totalInput: document.getElementById(`#${FormId.TotalInput}`) as
      | HTMLInputElement
      | undefined,
    submitButton: $<HTMLButtonElement>(`#${FormId.SubmitButton}`),
    amountErrorView: $(`#${FormId.AmountErrorView}`),
  }
}
