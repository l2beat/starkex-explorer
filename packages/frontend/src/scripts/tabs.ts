import { makeQuery } from './utils/query'

interface TabWithContent {
  tab: HTMLAnchorElement
  content: HTMLElement
}
const ARROWS_THRESHOLD = 2

/* eslint-disable @typescript-eslint/no-non-null-assertion */
export function initTabs() {
  const { $$ } = makeQuery(document.body)
  const tabs = $$('.Tabs')

  tabs.forEach(configureTabsNavigation)
}

function configureTabsNavigation(tabNavigation: HTMLElement) {
  const elements = getElements(tabNavigation)
  if (!elements) {
    return
  }
  const {
    tabsContainer,
    tabsWithContent,
    tabs,
    underline,
    arrowLeft,
    arrowRight,
  } = elements

  const highlightTab = (tab: HTMLAnchorElement) => {
    tabsWithContent[selectedId]!.tab.classList.remove(
      'bg-brand',
      'bg-opacity-20'
    )
    tab.classList.add('bg-brand', 'bg-opacity-20')
  }

  const switchContent = (content: HTMLElement) => {
    tabsWithContent[selectedId]!.content.classList.add('hidden')
    content.classList.remove('hidden')
  }

  const moveUnderline = (tab: HTMLAnchorElement) => {
    underline.style.left = `${tab.offsetLeft}px`
    underline.style.width = `${tab.clientWidth}px`
  }

  const scrollToItem = (item: HTMLAnchorElement) => {
    const scrollPosition =
      item.offsetLeft -
      tabsContainer.getBoundingClientRect().width / 2 +
      item.offsetWidth / 2
    console.log(scrollPosition)
    tabsContainer.scrollTo({
      left: scrollPosition,
      behavior: 'smooth',
    })
  }

  const showArrows = () => {
    const isScrolledToStart = tabsContainer.scrollLeft < ARROWS_THRESHOLD
    const isScrolledToEnd =
      tabsContainer.scrollLeft >
      tabsContainer.scrollWidth - tabsContainer.clientWidth - ARROWS_THRESHOLD

    arrowLeft.classList.toggle('opacity-0', isScrolledToStart)

    arrowRight.classList.toggle('opacity-0', isScrolledToEnd)
  }

  const onArrowClick = (dir: 'left' | 'right') => {
    const scrollPosition = tabsContainer.getBoundingClientRect().width
    tabsContainer.scrollBy({
      left: dir === 'left' ? -scrollPosition : scrollPosition,
      behavior: 'smooth',
    })
  }

  const onTabClick = (id: string) => {
    const tabWithContent = tabsWithContent[id]

    switchContent(tabWithContent!.content)
    highlightTab(tabWithContent!.tab)
    moveUnderline(tabWithContent!.tab)
    scrollToItem(tabWithContent!.tab)
    selectedId = id
  }

  const onResize = () => {
    const tabWithContent = tabsWithContent[selectedId]
    moveUnderline(tabWithContent!.tab)
    showArrows()
  }

  let selectedId =
    tabs.find((tab) => tab.href.endsWith(window.location.hash))?.id ??
    tabs[0]!.id

  onTabClick(selectedId)

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault()
      history.replaceState({}, '', tab.href)
      onTabClick(tab.id)
    })
  })

  showArrows()
  tabsContainer.addEventListener('scroll', showArrows)
  arrowLeft.addEventListener('click', () => onArrowClick('left'))
  arrowRight.addEventListener('click', () => onArrowClick('right'))

  window.addEventListener('resize', onResize)
  window.addEventListener('load', () => {
    onTabClick(selectedId)
  })
}

function getElements(tabNavigation: HTMLElement) {
  const { $, $$ } = makeQuery(tabNavigation)
  const tabsContainer = $('.TabsItemsContainer')
  const underline = $('.TabsUnderline')
  const arrowLeft = $('.TabsArrowLeft')
  const arrowRight = $('.TabsArrowRight')
  const tabs = $$<HTMLAnchorElement>('.TabsItem')

  if (tabs.length === 0) {
    return
  }
  const tabsWithContent: Record<string, TabWithContent> = {}

  tabs.forEach((tab) => {
    const content = $<HTMLElement>(`#${tab.id}.TabsContent`)

    tabsWithContent[tab.id] = {
      tab,
      content,
    }
  })

  return {
    arrowLeft,
    arrowRight,
    tabsContainer,
    tabs,
    underline,
    tabsWithContent,
  }
}
