import { assertUnreachable, InstanceName } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import Cookie from 'js-cookie'

import { RECOVER_STARK_KEY_BUTTON_ID } from '../../view'
import { getUsersInfo } from '../metamask'
import {
  RecoveredKeys,
  recoverKeysApexMainnet,
  recoverKeysApexTestnet,
  recoverKeysDydx,
  recoverKeysMyria,
} from './recovery'

export function initStarkKeyRecovery() {
  const registerButton = document.getElementById(RECOVER_STARK_KEY_BUTTON_ID)
  const cookieAccount = Cookie.get('account')
  const account = cookieAccount ? EthereumAddress(cookieAccount) : undefined

  if (!registerButton || !account) {
    return
  }
  const { instanceName, isMainnet } = getDataFromButton(registerButton)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  registerButton.addEventListener('click', async () => {
    const keys = await recoverKeys(account, instanceName, isMainnet)
    Cookie.set('starkKey', keys.starkKey.toString())
    setToLocalStorage(account, keys)
    window.location.href = `/users/${keys.starkKey.toString()}`
  })
}

const getDataFromButton = (button: HTMLElement) => {
  const instanceName = InstanceName.parse(button.dataset.instanceName)
  if (button.dataset.isMainnet === undefined) {
    throw new Error('isMainnet is undefined')
  }

  const isMainnet = button.dataset.isMainnet === 'true'

  return { instanceName, isMainnet }
}

const setToLocalStorage = (account: EthereumAddress, keys: RecoveredKeys) => {
  const accountsMap = getUsersInfo()

  accountsMap[account.toLowerCase()] = {
    starkKey: keys.starkKey,
    registration: keys.registration,
  }

  localStorage.setItem('accountsMap', JSON.stringify(accountsMap))
}

const recoverKeys = (
  account: EthereumAddress,
  instanceName: InstanceName,
  isMainnet: boolean
): Promise<RecoveredKeys> => {
  switch (instanceName) {
    case 'dYdX':
      return recoverKeysDydx(account)
    case 'Myria':
      return recoverKeysMyria(account)
    case 'ApeX':
      return isMainnet
        ? recoverKeysApexMainnet(account)
        : recoverKeysApexTestnet(account)
    case 'GammaX':
      //TODO: Implement
      throw new Error('NIY')
    default:
      assertUnreachable(instanceName)
  }
}
