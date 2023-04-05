import { EthereumAddress, StarkKey } from '@explorer/types'
import Cookies from 'js-cookie'
import { REGISTER_ETHEREUM_ADDRESS_BUTTON_ID } from '../view/pages/user/components/UserProfile'
import { Registration } from './keys/keys'
import { Wallet } from './peripherals/wallet'

export function initEthereumAddressRegistration() {
  const registerButton = document.getElementById(
    REGISTER_ETHEREUM_ADDRESS_BUTTON_ID
  )

  if (!registerButton) {
    return
  }

  registerButton.addEventListener('click', async (e) => {
    e.preventDefault()
    const account = Cookies.get('account')
    const starkKey = Cookies.get('starkKey')
    const registration = localStorage.getItem('registration')
    const exchangeAddress = registerButton.dataset.exchangeAddress

    if (!account || !starkKey || !registration || !exchangeAddress) {
      throw Error('Missing account, starkKey, registration, or exchangeAddress')
    }

    await Wallet.sendRegistrationTransaction(
      EthereumAddress(account),
      StarkKey(starkKey),
      Registration.parse(JSON.parse(registration)),
      EthereumAddress(exchangeAddress)
    )

    window.location.reload()
  })
}
