import { makeQuery } from './utils/query'

export function initExpandableSearchBar() {
  const { $ } = makeQuery(document.body)
  const searchBar = $.maybe('.SearchBar.Expandable')
  const searchBarButton = $.maybe('.SearchBar.Expandable > button')
  const searchBarInput = $.maybe('.SearchBar.Expandable > input')
  if (!searchBarInput || !searchBarButton) return
  const navLinks = $('.NavLinks')

  let isOpen = false
  const open = () => {
    searchBarInput.focus()
    searchBarInput.classList.add('mr-10', 'w-[470px]', 'cursor-text')
    navLinks.classList.add('opacity-0', 'pointer-events-none')
    isOpen = true
  }

  const close = () => {
    searchBarInput.classList.remove('mr-10', 'w-[470px]', 'cursor-text')
    navLinks.classList.remove('opacity-0', 'pointer-events-none')
    isOpen = false
  }
  searchBarButton.addEventListener('click', (e) => {
    if (isOpen) {
      return
    }
    e.preventDefault()
    open()
  })

  window.addEventListener('click', (e) => {
    if (searchBar?.contains(e.target as Node)) return
    close()
  })

  window.addEventListener('blur', close)
}
