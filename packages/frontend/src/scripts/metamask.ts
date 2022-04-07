export function initMetamask() {
  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )
  if (!connectButton) {
    return
  }

  connectButton.addEventListener('click', () => {
    if (typeof window.ethereum === 'undefined') {
      window.alert('MetaMask is not installed!')
      return
    }
    window.ethereum.request({ method: 'eth_requestAccounts' })
  })
}
