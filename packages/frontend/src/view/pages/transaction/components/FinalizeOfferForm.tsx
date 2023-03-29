import { FinalizeOfferData, serializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

export const FINALIZE_OFFER_FORM_ID = 'finalize-offer-form'

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
      className={FINALIZE_OFFER_FORM_ID}
      //TODO: Change this to the correct path
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
