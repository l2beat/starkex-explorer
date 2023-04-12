import { EthereumAddress, StarkKey } from '@explorer/types'
import Cookies from 'js-cookie'

import { REGISTER_ETHEREUM_ADDRESS_BUTTON_ID } from '../view/pages/user/components/UserProfile'
import { getUsersInfo } from './metamask'
import { Wallet } from './peripherals/wallet'

export function initEthereumAddressRegistration() {
  const registerButton = document.getElementById(
    REGISTER_ETHEREUM_ADDRESS_BUTTON_ID
  )

  if (!registerButton) {
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  registerButton.addEventListener('click', async (e) => {
    e.preventDefault()
    const account = Cookies.get('account')
    const starkKey = Cookies.get('starkKey')
    const usersInfo = getUsersInfo()
    const userInfo = account ? usersInfo[account] : undefined

    const exchangeAddress = registerButton.dataset.exchangeAddress

    if (!account || !starkKey || !userInfo || !exchangeAddress) {
      throw Error('Missing account, starkKey, registration, or exchangeAddress')
    }

    await Wallet.sendRegistrationTransaction(
      EthereumAddress(account),
      StarkKey(starkKey),
      userInfo.registration,
      EthereumAddress(exchangeAddress)
    )

    window.location.reload()
  })
}
