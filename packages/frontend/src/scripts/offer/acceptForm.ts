import {
  deserializeAcceptedData,
  deserializeCreateOfferData,
  serializeAcceptOfferBody,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

// eslint-disable-next-line no-restricted-imports
import { FormClass } from '../../view/old/offers/accept-form/attributes'
import * as Wallet from '../peripherals/wallet'
import { getAttribute } from './getAttribute'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const offer = deserializeCreateOfferData(getAttribute(form, 'offer'))
      const accepted = deserializeAcceptedData(getAttribute(form, 'accepted'))
      const signature = await Wallet.signAccepted(address, offer, accepted)
      await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: serializeAcceptOfferBody({
          ...accepted,
          signature,
        }),
      })
      window.location.reload()
    })
  })
}
