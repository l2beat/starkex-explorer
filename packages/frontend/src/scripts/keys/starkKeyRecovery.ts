import { InstanceName } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import Cookie from 'js-cookie'

import { RECOVER_STARK_KEY_BUTTON_ID } from '../../view'
import { RecoveredKeys, recoverKeysDydx, recoverKeysMyria } from './recovery'

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
    localStorage.setItem('registration', JSON.stringify(keys.registration))
    window.location.href = `/users/${keys.starkKey.toString()}`
  })
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
    case 'GammaX':
      //TODO: Implement
      throw new Error('NIY')
    default:
      // TODO: Use assertUnreachable after merging
      throw new Error('Unknown instance name')
  }
}
