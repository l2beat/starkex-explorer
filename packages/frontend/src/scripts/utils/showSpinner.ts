export async function showSpinner(
  button: HTMLElement,
  cb: () => Promise<void>
) {
  button.setAttribute('data-state', 'loading')
  button.setAttribute('disabled', 'true')
  try {
    await cb()
  } finally {
    button.removeAttribute('data-state')
    button.removeAttribute('disabled')
  }
}
