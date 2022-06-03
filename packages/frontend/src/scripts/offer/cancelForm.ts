import { serializeCancelOfferBody } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import { DataAttributes, FormClass } from '../../pages/offers/cancel-form'
import { parseDataAttribute } from './findAndParse'
import { signCancel } from './sign'

export function initCancelOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form?.addEventListener('submit', async (e) => {
      e.preventDefault()
      const offerId = parseDataAttribute(form, DataAttributes.OfferId, Number)
      const address = parseDataAttribute(
        form,
        DataAttributes.Address,
        EthereumAddress
      )
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
