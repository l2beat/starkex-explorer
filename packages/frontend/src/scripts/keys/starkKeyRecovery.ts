import { assertUnreachable, InstanceName } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import Cookie from 'js-cookie'

import { RECOVER_STARK_KEY_BUTTON_ID } from '../../view'
import { getUsersInfo } from '../metamask'
import { makeQuery } from '../utils/query'
import { showSpinner } from '../utils/showSpinner'
import {
  RecoveredKeys,
  recoverKeysApex,
  recoverKeysDydx,
  recoverKeysMyria,
} from './recovery'

export function initStarkKeyRecovery() {
  const { $ } = makeQuery(document.body)

  const registerButton = $.maybe(`#${RECOVER_STARK_KEY_BUTTON_ID}`)
  const cookieAccount = Cookie.get('account')
  const account = cookieAccount ? EthereumAddress(cookieAccount) : undefined

  if (!registerButton || !account) {
    return
  }
  const { instanceName, chainId } = getDataFromButton(registerButton)
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  registerButton.addEventListener('click', () =>
    showSpinner(registerButton, async () => {
      const keys = await recoverKeys(account, instanceName, chainId)
      Cookie.set('starkKey', keys.starkKey.toString())
      setToLocalStorage(account, keys)
      window.location.href = `/users/${keys.starkKey.toString()}`
    })
  )
}

const getDataFromButton = (button: HTMLElement) => {
  const instanceName = InstanceName.parse(button.dataset.instanceName)
  if (button.dataset.chainId === undefined) {
    throw new Error('chainId not passed to stark key recovery button')
  }

  return { instanceName, chainId: Number(button.dataset.chainId) }
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
  chainId: number
): Promise<RecoveredKeys> => {
  switch (instanceName) {
    case 'dYdX':
      return recoverKeysDydx(account, chainId)
    case 'Myria':
      return recoverKeysMyria(account)
    case 'ApeX':
      return recoverKeysApex(account, chainId)
    case 'GammaX':
      //TODO: Implement
      throw new Error('NIY')
    default:
      assertUnreachable(instanceName)
  }
}
