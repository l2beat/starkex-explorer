import { stringAs } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import Cookie from 'js-cookie'
import { z } from 'zod'

import { Registration } from './keys/keys'
import { makeQuery } from './utils/query'

type UsersInfo = z.infer<typeof UsersInfo>
const UsersInfo = z.record(
  z.object({ starkKey: stringAs(StarkKey), registration: Registration })
)

export const getUsersInfo = (): UsersInfo => {
  const usersInfoLocalStorage = localStorage.getItem('accountsMap')

  if (!usersInfoLocalStorage) {
    return {}
  }

  return UsersInfo.parse(JSON.parse(usersInfoLocalStorage))
}

export function initMetamask() {
  const provider = window.ethereum
  const { $ } = makeQuery(document.body)

  const connectButton = $.maybe<HTMLButtonElement>('#connect-with-metamask')
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

  provider.request({ method: 'eth_accounts' }).catch(console.error)

  provider
    .request({ method: 'eth_chainId' })
    .then((chainId) => {
      updateChainId(chainId as string)
    })
    .catch(console.error)

  provider.on('accountsChanged', (accounts) => {
    updateAccounts(accounts)
  })

  provider.on('chainChanged', (chainId) => {
    updateChainId(chainId)
  })

  function updateAccounts(accounts: string[]) {
    deleteDisconnectedAccountsFromUsersInfo(accounts)
    const connectedAccount = accounts.at(0)
    const currentAccount = Cookie.get('account')

    const accountsMap = getUsersInfo()

    if (connectedAccount !== currentAccount) {
      if (connectedAccount) {
        Cookie.set('account', connectedAccount.toString())
        const accountMap = accountsMap[connectedAccount]
        if (accountMap?.starkKey) {
          Cookie.set('starkKey', accountMap.starkKey.toString())
        } else {
          Cookie.remove('starkKey')
        }
      } else {
        localStorage.removeItem('accountsMap')
        Cookie.remove('account')
        Cookie.remove('starkKey')
      }
      location.reload()
    }
  }

  function deleteDisconnectedAccountsFromUsersInfo(
    connectedAccounts: string[]
  ) {
    const usersInfo = getUsersInfo()
    Object.keys(usersInfo).forEach((userAccount) => {
      if (!connectedAccounts.includes(userAccount)) {
        //eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete usersInfo[userAccount]
      }
    })

    localStorage.setItem('accountsMap', JSON.stringify(usersInfo))
  }

  const MAINNET_CHAIN_ID = '0x1'
  const GANACHE_CHAIN_ID = '0x539'
  function updateChainId(chainId: string) {
    if (chainId !== MAINNET_CHAIN_ID && chainId !== GANACHE_CHAIN_ID) {
      alert('Please change your metamask to mainnet')
    }
  }
}
