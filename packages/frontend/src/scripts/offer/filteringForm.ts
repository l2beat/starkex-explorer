// eslint-disable-next-line no-restricted-imports
import {
  AssetIdSelectName,
  DisabledOptionValue,
  FormId,
  TypeRadioName,
} from '../../view/old/offers/filtering/attributes'

export function initOffersFilteringForm() {
  const form = document.querySelector<HTMLFormElement>(`#${FormId}`)
  form?.addEventListener('change', () => {
    const assetIdEl = form.querySelector<HTMLSelectElement>(
      `[name="${AssetIdSelectName}"]`
    )
    const typeEl = form.querySelector<HTMLInputElement>(
      `[name="${TypeRadioName}"]:checked`
    )

    disableIfNecessary(assetIdEl)
    disableIfNecessary(typeEl)

    form.submit()
  })
}

function disableIfNecessary(
  element: HTMLSelectElement | HTMLInputElement | null
) {
  if (!element || element.value !== DisabledOptionValue) {
    return
  }
  element.setAttribute('disabled', '')
}
