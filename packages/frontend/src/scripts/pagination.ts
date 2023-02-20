export function initPagination() {
  const forms = document.querySelectorAll<HTMLFormElement>(
    '[data-component="TableLimitSelect"]'
  )
  forms.forEach((form) => {
    const select = form.querySelector('select')
    select?.addEventListener('change', () => form.submit())
  })
}
