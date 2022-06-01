import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { AddressInputName, FormId, OfferIdInputName } from './attributes'

interface CancelOfferFormProps {
  offerId: number
  address: EthereumAddress
  children: ReactNode
}

export function CancelOfferForm(props: CancelOfferFormProps) {
  return (
    <form
      id={FormId}
      method="POST"
      action={`/forced/offers/${props.offerId}/cancel`}
    >
      <input type="hidden" value={props.offerId} name={OfferIdInputName} />
      <input
        type="hidden"
        value={props.address.toString()}
        name={AddressInputName}
      />
      {props.children}
    </form>
  )
}
