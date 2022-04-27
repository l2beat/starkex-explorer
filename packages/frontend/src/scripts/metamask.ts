import Cookie from 'js-cookie'

export function initMetamask() {
  const provider = window.ethereum

  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )
  if (connectButton) {
    connectButton.addEventListener('click', () => {
      if (provider) {
        provider.request({ method: 'eth_requestAccounts' })
      } else {
        window.open('https://metamask.io/download/')
      }
    })
  }

  if (!provider) {
    return
  }

  provider.request({ method: 'eth_accounts' }).then((accounts) => {
    updateAccount((accounts as string[])[0])
  })

  provider.request({ method: 'eth_chainId' }).then((chainId) => {
    updateChainId(chainId as string)
  })

  provider.on('accountsChanged', (accounts) => {
    updateAccount(accounts[0])
  })

  provider.on('chainChanged', (chainId) => {
    updateChainId(chainId)
  })

  function updateAccount(account: string | undefined) {
    const lower = account?.toLowerCase()
    const existing = Cookie.get('account')
    if (lower !== existing) {
      if (lower !== undefined) {
        Cookie.set('account', lower)
      } else {
        Cookie.remove('account')
      }
      location.reload()
    }
  }

  function updateChainId(chainId: string) {
    if (chainId !== '0x1') {
      alert('Please change your metamask to mainnet')
    }
  }
}
