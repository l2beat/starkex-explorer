import { assertUnreachable, InstanceName } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import Cookie from 'js-cookie'

import { RECOVER_STARK_KEY_BUTTON_ID } from '../../view'
import { getUsersInfo } from '../metamask'
import {
  RecoveredKeys,
  recoverKeysApex,
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
  const instanceName = InstanceName.parse(registerButton.dataset.instanceName)

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  registerButton.addEventListener('click', async () => {
    const keys = await recoverKeys(account, instanceName)
    Cookie.set('starkKey', keys.starkKey.toString())
    setToLocalStorage(account, keys)
    window.location.href = `/users/${keys.starkKey.toString()}`
  })
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
  instanceName: InstanceName
): Promise<RecoveredKeys> => {
  switch (instanceName) {
    case 'dYdX':
      return recoverKeysDydx(account)
    case 'Myria':
      return recoverKeysMyria(account)
    case 'ApeX':
      return recoverKeysApex(account)
    case 'GammaX':
      //TODO: Implement
      throw new Error('NIY')
    default:
      assertUnreachable(instanceName)
  }
}
