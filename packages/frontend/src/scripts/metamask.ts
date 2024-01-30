import { stringAs } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import Cookie from 'js-cookie'
import { z } from 'zod'

import { Registration } from './keys/keys'
import { MetamaskClient } from './MetamaskClient'
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
  const instanceChainId = getInstanceChainId()
  if (!provider) {
    connectButton?.addEventListener('click', () => {
      window.open('https://metamask.io/download/')
    })
    return
  }

  const metamaskClient = new MetamaskClient(provider, instanceChainId)

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  connectButton?.addEventListener('click', async () => {
    const chainId = await metamaskClient.getChainId()
    if (instanceChainId !== Number(chainId)) {
      metamaskClient
        .switchToInstanceNetwork()
        .then(() => metamaskClient.requestAccounts())
        .catch(console.error)
      return
    }

    await metamaskClient.requestAccounts()
  })

  provider.on('accountsChanged', (accounts) => updateAccounts(accounts))

  provider.on('chainChanged', (chainId) =>
    updateChainId(chainId, instanceChainId)
  )
}

function updateChainId(chainId: string, instanceChainId: number) {
  const networkName = chainIdToNetworkName[instanceChainId]

  if (!networkName) {
    throw new Error(`Unknown chainId: ${instanceChainId}`)
  }

  if (Number(chainId) !== instanceChainId) {
    alert(`Please change your metamask to ${networkName} network`)
  }
}

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

function deleteDisconnectedAccountsFromUsersInfo(connectedAccounts: string[]) {
  const usersInfo = getUsersInfo()
  Object.keys(usersInfo).forEach((userAccount) => {
    if (!connectedAccounts.includes(userAccount)) {
      //eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete usersInfo[userAccount]
    }
  })

  localStorage.setItem('accountsMap', JSON.stringify(usersInfo))
}

const getInstanceChainId = () => {
  const instanceChainId = document.querySelector('html')?.dataset.chainId
  if (!instanceChainId) {
    throw new Error('Chain id not found')
  }
  return Number(instanceChainId)
}

const chainIdToNetworkName: Record<number, string> = {
  1: 'Mainnet',
  5: 'Goerli',
  539: 'Ganache',
}
