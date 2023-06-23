import { stringAs } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import { z } from 'zod'

import { Registration } from './keys/keys'
import { MetamaskClient } from './MetamaskClient'

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

  const connectButton = document.querySelector<HTMLButtonElement>(
    '#connect-with-metamask'
  )
  const instanceChainId = getInstanceChainId()

  if (!provider) {
    connectButton?.addEventListener('click', async () => {
      window.open('https://metamask.io/download/')
    })
    return
  }

  const metamaskClient = new MetamaskClient(provider, instanceChainId)

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
}

const getInstanceChainId = () => {
  const instanceChainId = document.querySelector('html')?.dataset.chainId
  if (!instanceChainId) {
    throw new Error('Chain id not found')
  }
  return Number(instanceChainId)
}
