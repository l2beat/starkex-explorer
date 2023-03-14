import Cookie from 'js-cookie'

export async function initMetamask() {
 
  const provider = window.ethereum
  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )
     
  if (connectButton) {
    Cookie.set("is_walletconnect","false")
    connectButton.addEventListener('click', () => {
      if (provider) {
        provider.request({ method: 'eth_requestAccounts' }).catch(console.error)
        connectButton.disabled = false;
        connectButton.innerText = 'Connect Metamask'
      } else {
        window.open('https://metamask.io/download/')
      }
    })
  }
  
  const is_walletconnect = Cookie.get('is_walletconnect')
  if (!provider) {
    return
  }
  if (is_walletconnect == "false"){
    provider
    .request({ method: 'eth_accounts' })
    .then((accounts) => {
      updateAccount((accounts as string[])[0])
    })
    .catch(console.error)
    provider.on('accountsChanged', (accounts) => {
      updateAccount(accounts[0])
    })
  }
  // provider
  //   .request({ method: 'eth_chainId' })
  //   .then((chainId) => {
  //     updateChainId(chainId as string)
  //   })
  //   .catch(console.error)
  // provider.on('chainChanged', (chainId) => {
  //   updateChainId(chainId)
  // })
  function updateAccount(account: string | undefined) {
    console.log("account",account)
    const lower = account?.toLowerCase()
    const existing = Cookie.get('account')
    if (lower !== existing) {
      if (lower !== undefined) {
        Cookie.set("is_walletconnect","false")
        Cookie.set('account', lower)
      } else {
        Cookie.remove('account')
      }
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