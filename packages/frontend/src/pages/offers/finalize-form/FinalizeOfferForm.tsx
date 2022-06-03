import { FinalizeOfferData, serializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { OfferIdInputName } from '../cancel-form'
import {
  AddressInputName,
  FormClass,
  OfferInputName,
  PerpetualAddressInputName,
} from './attributes'

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
    <form className={FormClass} action="/forced/trades" method="POST">
      <input name={OfferIdInputName} type="hidden" value={offerId} />
      <input name={OfferInputName} type="hidden" value={offerJson} />
      <input name={AddressInputName} type="hidden" value={address.toString()} />
      <input
        name={PerpetualAddressInputName}
        type="hidden"
        value={perpetualAddress.toString()}
      />
      {props.children}
    </form>
  )
}
