import { makeQuery } from './utils/query'

export function initCopyButtons() {
  const { $$ } = makeQuery(document.body)

  const copyButtons = $$<HTMLButtonElement>('.CopyButton')
  for (const copyButton of copyButtons) {
    const copyContent = copyButton.dataset.content
    if (!copyContent) {
      return
    }
    copyButton.addEventListener('click', () => onClick(copyContent))
  }

  async function onClick(copyContent: string) {
    await navigator.clipboard.writeText(copyContent)
  }
}
