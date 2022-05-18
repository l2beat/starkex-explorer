export function initPagination() {
  const select = document.querySelector<HTMLSelectElement>('#perPage')
  if (!select) {
    return
  }
  select.addEventListener('change', function () {
    this.form?.submit()
  })
}
