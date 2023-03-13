import { deserializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../view/old/offers/finalize-form/attributes'
import { Api } from '../peripherals/api'
import { Wallet } from '../peripherals/wallet'
import { getAttribute } from './getAttribute'

export function initFinalizeForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const offer = deserializeFinalizeOfferData(getAttribute(form, 'offer'))
      const offerId = Number(getAttribute(form, 'offer-id'))
      const perpetualAddress = EthereumAddress(
        getAttribute(form, 'perpetual-address')
      )
      const hash = await Wallet.sendPerpetualForcedTradeTransaction(
        address,
        offer,
        perpetualAddress
      )
      await Api.submitPerpetualForcedTrade(offerId, hash)
      window.location.href = `/forced/${hash.toString()}`
    })
  })
}
