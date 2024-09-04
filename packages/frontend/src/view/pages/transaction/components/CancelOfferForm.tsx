import { CancelOfferFormData } from '@explorer/shared'
import React, { ReactNode } from 'react'

export const CANCEL_OFFER_FORM_CLASS = 'cancel-offer-form'

interface CancelOfferFormProps extends CancelOfferFormData {
  children: ReactNode
}

export function CancelOfferForm(props: CancelOfferFormProps) {
  return (
    <form
      className={CANCEL_OFFER_FORM_CLASS}
      method="POST"
      action={`/offers/${props.offerId}/cancel`}
      data-offer-id={props.offerId.toString()}
      data-address={props.address.toString()}
    >
      {props.children}
    </form>
  )
}
