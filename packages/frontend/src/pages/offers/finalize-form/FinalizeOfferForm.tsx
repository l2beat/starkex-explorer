import { FinalizeOfferData, serializeFinalizeOfferData } from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import {
  AddressInputName,
  FormId,
  OfferInputName,
  PerpetualAddressInputName,
} from './attributes'

export interface FinalizeOfferFormData extends FinalizeOfferData {
  address: EthereumAddress
  perpetualAddress: EthereumAddress
}

interface FinalizeOfferFormProps extends FinalizeOfferFormData {
  children: ReactNode
}

export function FinalizeOfferForm(props: FinalizeOfferFormProps) {
  const { address, perpetualAddress, ...offer } = props
  const offerJson = serializeFinalizeOfferData(offer)
  return (
    <form id={FormId} action={`/forced/trades`} method="POST">
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
