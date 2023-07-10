import { makeQuery } from './utils/query'

export function initImageFallback() {
  const { $$ } = makeQuery(document.body)
  const imagesWithFallback = $$<HTMLImageElement>('img[data-fallback]')

  imagesWithFallback.forEach((image) => {
    image.addEventListener('error', () => {
      if (image.dataset.fallback) {
        image.src = image.dataset.fallback
        image.removeAttribute('data-fallback')
      }
    })

    image.dataset.src && image.setAttribute('src', image.dataset.src)
  })
}
