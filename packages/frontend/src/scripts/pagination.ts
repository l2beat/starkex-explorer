import { makeQuery } from './utils/query'

export function initPagination() {
  const { $$ } = makeQuery(document.body)
  const forms = $$<HTMLFormElement>('[data-component="TableLimitSelect"]')

  forms.forEach((form) => {
    const select = form.querySelector('select')
    select?.addEventListener('change', () => form.submit())
  })
}
