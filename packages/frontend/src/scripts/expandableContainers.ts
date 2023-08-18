import { makeQuery } from './utils/query'

export function initExpandableContainers() {
  const { $$ } = makeQuery(document.body)
  const expandableContainers = $$('.ExpandableContainer')

  expandableContainers.forEach(initExpandableContainer)
}

function initExpandableContainer(expandableContainer: HTMLElement) {
  const { $ } = makeQuery(expandableContainer)
  const content = $('.ExpandableContainer-Content')
  const toggleButton = $('.ExpandableContainer-Toggle')
  const toggleText = $('.ExpandableContainer-ToggleText')
  const toggleArrow = $('.ExpandableContainer-ToggleArrow')

  const expandLabel = toggleButton.dataset.expandLabel
  const collapseLabel = toggleButton.dataset.collapseLabel

  if (!expandLabel || !collapseLabel) {
    throw new Error(
      'ExpandableContainer-Toggle must have data-expand-label and data-collapse-label attributes'
    )
  }

  toggleButton.addEventListener('click', () => {
    const isCollapsed = content.classList.contains('max-h-0')
    if (isCollapsed) {
      expand()
      return
    }
    collapse()
  })

  const expand = () => {
    content.classList.remove('max-h-0')
    content.classList.add('max-h-screen')
    toggleArrow.classList.add('-rotate-180')
    toggleText.textContent = collapseLabel
  }

  const collapse = () => {
    content.classList.add('max-h-0')
    content.classList.remove('max-h-screen')
    toggleArrow.classList.remove('-rotate-180')
    toggleText.textContent = expandLabel
  }
}
