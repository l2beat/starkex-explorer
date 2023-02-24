export function initImageFallback() {
  const imagesWithFallback =
    document.querySelectorAll<HTMLImageElement>('img[data-fallback]')

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
