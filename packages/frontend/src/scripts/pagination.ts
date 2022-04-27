export function initPagination() {
  const select = document.querySelector<HTMLSelectElement>(
    'form.pagination select[name="perPage"]'
  )
  if (!select) {
    return
  }
  select.addEventListener('change', function () {
    this.form?.submit()
  })
}
