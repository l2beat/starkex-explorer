import { FinalizeOfferData, serializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { toDataProps } from '../toDataProps'
import { DataAttributes, FormClass } from './attributes'

export interface FinalizeOfferFormData extends FinalizeOfferData {
  offerId: number
  address: EthereumAddress
  perpetualAddress: EthereumAddress
}

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
      {...toDataProps({
        [DataAttributes.OfferId]: offerId.toString(),
        [DataAttributes.Offer]: offerJson,
        [DataAttributes.Address]: address.toString(),
        [DataAttributes.PerpetualAddress]: perpetualAddress.toString(),
      })}
    >
      {props.children}
    </form>
  )
}
