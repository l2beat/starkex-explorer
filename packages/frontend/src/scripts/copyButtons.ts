import { makeQuery } from './utils/query'

export function initCopyButtons() {
  const { $$ } = makeQuery(document.body)

  const copyButtons = $$<HTMLButtonElement>('.CopyButton')
  for (const copyButton of copyButtons) {
    const copyContent = copyButton.dataset.content
    if (!copyContent) {
      return
    }
    //eslint-disable-next-line @typescript-eslint/no-misused-promises
    copyButton.addEventListener('click', () => onClick(copyContent))
    //eslint-enable-next-line @typescript-eslint/no-misused-promises
  }

  async function onClick(copyContent: string) {
    await navigator.clipboard.writeText(copyContent)
  }
}
