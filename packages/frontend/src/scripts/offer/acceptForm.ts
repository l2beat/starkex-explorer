import {
  deserializeAcceptedData,
  serializeAcceptOfferBody,
} from '@explorer/shared'
import { deserializeCreateOfferData } from '@explorer/shared/build/src/CreateOfferData'
import { EthereumAddress } from '@explorer/types'

import { DataAttributes, FormClass } from '../../pages/offers/accept-form'
import { parseDataAttribute } from './findAndParse'
import { signAccepted } from './sign'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = parseDataAttribute(
        form,
        DataAttributes.Address,
        EthereumAddress
      )
      const offer = parseDataAttribute(
        form,
        DataAttributes.Offer,
        deserializeCreateOfferData
      )
      const accepted = parseDataAttribute(
        form,
        DataAttributes.Accepted,
        deserializeAcceptedData
      )

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
