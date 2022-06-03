import { serializeCancelOfferBody } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { FormClass } from '../../pages/offers/cancel-form'
import { parseAttribute } from './parseAttribute'
import { signCancel } from './sign'

export function initCancelOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const data = form.dataset
      const offerId = parseAttribute(data.offerId, Number)
      const address = parseAttribute(data.address, EthereumAddress)
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
