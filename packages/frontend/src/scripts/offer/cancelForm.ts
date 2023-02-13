import { serializeCancelOfferBody } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FormClass } from '../../view/old/offers/cancel-form/attributes'
import { getAttribute } from './getAttribute'
import { signCancel } from './sign'

export function initCancelOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const offerId = Number(getAttribute(form, 'offer-id'))
      const address = EthereumAddress(getAttribute(form, 'address'))
      const signature = await signCancel(offerId, address)
      if (!signature) {
        throw new Error('Could not create a signature for cancel form')
      }
      await fetch(form.action, {
        method: form.method,
        headers: { 'Content-Type': 'application/json' },
        body: serializeCancelOfferBody({ signature }),
      })
      window.location.href = `/forced/offers/${offerId.toString()}`
    })
  })
}
