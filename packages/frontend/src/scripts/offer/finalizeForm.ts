import {
  deserializeFinalizeOfferData,
  serializeFinalizeOfferBody,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../view/old/offers/finalize-form/attributes'
import * as Wallet from '../peripherals/wallet'
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
      const hash = await Wallet.sendForcedTradeTransaction(
        address,
        offer,
        perpetualAddress
      )
      await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: serializeFinalizeOfferBody({
          offerId,
          hash,
        }),
      })
      window.location.href = `/forced/${hash.toString()}`
    })
  })
}
