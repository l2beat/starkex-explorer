import {
  deserializeAcceptedData,
  deserializeCreateOfferData,
  serializeAcceptOfferBody,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FormClass } from '../../pages/offers/accept-form/attributes'
import { getAttribute } from './getAttribute'
import { signAccepted } from './sign'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = EthereumAddress(getAttribute(form, 'address'))
      const offer = deserializeCreateOfferData(getAttribute(form, 'offer'))
      const accepted = deserializeAcceptedData(getAttribute(form, 'accepted'))
      const signature = await signAccepted(offer, accepted, address)
      if (!signature) {
        throw new Error('Could not create a signature for accept form')
      }
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
