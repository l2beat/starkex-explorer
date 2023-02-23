export function initStateUpdateStats() {
  const components = document.querySelectorAll(
    '[data-component="StateUpdateStats"]'
  )
  components.forEach((component) => {
    const button = component.querySelector('button')
    const advanced = component.querySelector(
      '[data-component="StateUpdateStats-Advanced"]'
    )
    if (!button || !advanced) {
      return
    }
    const chevrons = button.querySelectorAll('svg')
    button.addEventListener('click', () => {
      chevrons.forEach((chevron) => {
        chevron.classList.toggle('hidden')
        chevron.classList.toggle('inline-block')
      })
      advanced.classList.toggle('hidden')
    })
  })
}
