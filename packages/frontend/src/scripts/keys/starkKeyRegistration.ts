import { assertUnreachable } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import Cookie from 'js-cookie'

import { InstanceName } from '../../utils/instance'
import { recoverKeysDydx, recoverKeysMyria } from './recovery'

export function initStarkKeyRegistration() {
  const registerButton =
    document.querySelector<HTMLButtonElement>(`#register-button`)
  const cookieAccount = Cookie.get('account')
  const account = cookieAccount ? EthereumAddress(cookieAccount) : undefined

  if (!registerButton || !account) {
    return
  }
  const instanceName = InstanceName.parse(registerButton.dataset.instanceName)

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  registerButton.addEventListener('click', async () => {
    const keys = await recoverKeys(account, instanceName)
    Cookie.set('starkKey', keys.starkKey)
    localStorage.setItem('registration', JSON.stringify(keys.registration))
    window.location.href = `/users/${keys.starkKey}`
  })
}

const recoverKeys = (account: EthereumAddress, instanceName: InstanceName) => {
  switch (instanceName) {
    case 'dYdX':
      return recoverKeysDydx(account)
    case 'Myria':
      return recoverKeysMyria(account)
    case 'GammaX':
      //TODO: Implement
      throw new Error('NIY')
    default:
      assertUnreachable(instanceName)
  }
}
