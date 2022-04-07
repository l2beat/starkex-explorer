export function initMetamask() {
  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )

  if (!connectButton) {
    return
  }

  const provider = window.ethereum
  if (provider === undefined) {
    connectButton.addEventListener('click', () => {
      window.open('https://metamask.io/download/')
    })
    return
  }

  connectButton.addEventListener('click', () => {
    provider.request({ method: 'eth_requestAccounts' })
  })
}
