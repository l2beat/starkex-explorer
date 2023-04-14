import {
  FinalizeOfferFormData,
  serializeFinalizeOfferData,
} from '@explorer/shared'
import React, { ReactNode } from 'react'

import { FormClass } from './attributes'

interface FinalizeOfferFormProps extends FinalizeOfferFormData {
  children: ReactNode
}

export function FinalizeOfferForm(props: FinalizeOfferFormProps) {
  const { address, perpetualAddress, offerId, ...offer } = props
  const offerJson = serializeFinalizeOfferData(offer)
  return (
    <form
      className={FormClass}
      action="/forced/trades"
      method="POST"
      data-offer-id={offerId.toString()}
      data-offer={offerJson}
      data-address={address.toString()}
      data-perpetual-address={perpetualAddress.toString()}
    >
      {props.children}
    </form>
  )
}
