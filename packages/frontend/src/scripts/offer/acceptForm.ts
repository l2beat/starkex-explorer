import {
  deserializeAcceptedData,
  deserializeCreateOfferData,
  serializeAcceptOfferBody,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'

import {
  AcceptedInputName,
  AddressInputName,
  FormClass,
  OfferInputName,
} from '../../pages/offers/accept-form/attributes'
import { findAndParse } from './findAndParse'
import { signAccepted } from './sign'

export function initAcceptOfferForm() {
  const forms = document.querySelectorAll<HTMLFormElement>(`.${FormClass}`)
  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      const address = findAndParse(form, AddressInputName, EthereumAddress)
      const offer = findAndParse(
        form,
        OfferInputName,
        deserializeCreateOfferData
      )
      const accepted = findAndParse(
        form,
        AcceptedInputName,
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
