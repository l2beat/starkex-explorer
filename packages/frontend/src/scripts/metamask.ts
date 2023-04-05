import Cookie from 'js-cookie'

export function initMetamask() {
  const provider = window.ethereum

  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )
  if (connectButton) {
    connectButton.addEventListener('click', () => {
      if (provider) {
        provider.request({ method: 'eth_requestAccounts' }).catch(console.error)
      } else {
        window.open('https://metamask.io/download/')
      }
    })
  }

  if (!provider) {
    return
  }

  provider
    .request({ method: 'eth_accounts' })
    .then((accounts) => {
      updateAccount((accounts as string[])[0])
    })
    .catch(console.error)

  provider
    .request({ method: 'eth_chainId' })
    .then((chainId) => {
      updateChainId(chainId as string)
    })
    .catch(console.error)

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
      Cookie.remove('starkKey')
      localStorage.removeItem('registration')
      location.reload()
    }
  }

  const MAINNET_CHAIN_ID = '0x1'
  const GANACHE_CHAIN_ID = '0x539'
  function updateChainId(chainId: string) {
    if (chainId !== MAINNET_CHAIN_ID && chainId !== GANACHE_CHAIN_ID) {
      alert('Please change your metamask to mainnet')
    }
  }
}
