import { EthereumAddress, StarkKey } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../../view/old/forced-transactions/finalize-form'
import { Api } from '../../peripherals/api'
import { Wallet } from '../../peripherals/wallet'
import { getAttribute } from '../offer/getAttribute'

export function initFinalizeExitForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const perpetualAddress = EthereumAddress(
        getAttribute(form, 'perpetual-address')
      )
      const starkKey = StarkKey(getAttribute(form, 'stark-key'))
      const finalizeHash = await Wallet.sendOldWithdrawalTransaction(
        address,
        starkKey,
        perpetualAddress
      )
      await Api.submitWithdrawal(finalizeHash)
      window.location.reload()
    })
  })
}
