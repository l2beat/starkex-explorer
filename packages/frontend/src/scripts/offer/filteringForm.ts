import {
  AssetIdSelectName,
  DisabledOptionValue,
  FormId,
  TypeRadioName,
} from '../../pages/offers/filtering'

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
