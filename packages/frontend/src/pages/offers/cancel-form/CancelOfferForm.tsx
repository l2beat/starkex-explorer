import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { FormClass } from './attributes'

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
      className={FormClass}
      method="POST"
      action={`/forced/offers/${props.offerId}/cancel`}
      data-offer-id={props.offerId.toString()}
      data-address={props.address.toString()}
    >
      {props.children}
    </form>
  )
}
