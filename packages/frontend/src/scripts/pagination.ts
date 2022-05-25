import { styles } from '../pages/common/pagination/styles'

export function initPagination() {
  initServerPagination()
  initClientPagination()
}

function initServerPagination() {
  const form = document.querySelector<HTMLFormElement>('#serverPagination')
  form?.addEventListener('change', () => form.submit())
}

function initClientPagination() {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[data-paginates]')
  )
  for (const pagination of items) {
    initClientPaginationInstance(pagination)
  }
}

function initClientPaginationInstance(pagination: HTMLElement) {
  const state = { page: 1, perPage: 10 }
  const ui = getPaginationElements(pagination)

  ui.firstButton.addEventListener('click', () => onChange(1, state.perPage))
  ui.previousButton.addEventListener('click', () =>
    onChange(state.page - 1, state.perPage)
  )
  ui.nextButton.addEventListener('click', () =>
    onChange(state.page + 1, state.perPage)
  )
  ui.lastButton.addEventListener('click', () =>
    onChange(Math.ceil(ui.rows.length / state.perPage), state.perPage)
  )
  ui.perPageSelect.addEventListener('change', () =>
    onChange(1, Number(ui.perPageSelect.value))
  )

  onChange(state.page, state.perPage)

  function onChange(page: number, perPage: number) {
    state.page = page
    state.perPage = perPage

    const start = (page - 1) * perPage
    const end = page * perPage
    const last = Math.ceil(ui.rows.length / perPage)

    for (const [i, row] of ui.rows.entries()) {
      row.classList.toggle('hidden', i < start || i >= end)
    }

    if (page === 1) {
      ui.firstButton.setAttribute('disabled', '')
      ui.firstButton.className = styles.textButtonInactive
      ui.previousButton.setAttribute('disabled', '')
      ui.previousButton.className = styles.arrowButtonInactive
    } else {
      ui.firstButton.removeAttribute('disabled')
      ui.firstButton.className = styles.textButtonActive
      ui.previousButton.removeAttribute('disabled')
      ui.previousButton.className = styles.arrowButtonActive
    }

    if (page === last) {
      ui.nextButton.setAttribute('disabled', '')
      ui.nextButton.className = styles.arrowButtonInactive
      ui.lastButton.setAttribute('disabled', '')
      ui.lastButton.className = styles.textButtonInactive
    } else {
      ui.nextButton.removeAttribute('disabled')
      ui.nextButton.className = styles.arrowButtonActive
      ui.lastButton.removeAttribute('disabled')
      ui.lastButton.className = styles.textButtonActive
    }

    ui.currentPageView.innerText = `Page ${page} out of ${last}`
  }
}

function getPaginationElements(pagination: HTMLElement) {
  const tableId = pagination.dataset.paginates
  const table = document.querySelector<HTMLTableElement>(`#${tableId}`)
  const [firstButton, previousButton, nextButton, lastButton] = Array.from(
    pagination.querySelectorAll<HTMLButtonElement>('button')
  )
  const currentPageView = pagination.querySelector<HTMLSpanElement>(
    'div:first-child span'
  )
  const perPageSelect = pagination.querySelector<HTMLSelectElement>('select')

  if (
    !firstButton ||
    !previousButton ||
    !nextButton ||
    !lastButton ||
    !currentPageView ||
    !perPageSelect ||
    !table
  ) {
    throw new Error(`ClientPagination misconfigured for #${tableId}`)
  }

  const rows = Array.from(
    table.querySelectorAll<HTMLTableRowElement>('tbody tr')
  )

  return {
    firstButton,
    previousButton,
    nextButton,
    lastButton,
    currentPageView,
    perPageSelect,
    rows,
  }
}
