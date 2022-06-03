import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { toDataProps } from '../toDataProps'
import { DataAttributes, FormClass } from './attributes'

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
      {...toDataProps({
        [DataAttributes.OfferId]: props.offerId.toString(),
        [DataAttributes.Address]: props.address.toString(),
      })}
    >
      {props.children}
    </form>
  )
}
