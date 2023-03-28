import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

export const CANCEL_OFFER_FORM_ID = 'cancel-offer-form'

export interface CancelOfferFormData {
  offerId: number
  address: EthereumAddress
}

interface CancelOfferFormProps extends CancelOfferFormData {
  children: ReactNode
}

export function CancelOfferForm(props: CancelOfferFormProps) {
  return (
    <form
      className={CANCEL_OFFER_FORM_ID}
      method="POST"
      action={`/offers/${props.offerId}/cancel`}
      data-offer-id={props.offerId.toString()}
      data-address={props.address.toString()}
    >
      {props.children}
    </form>
  )
}
