import {
  AcceptedData,
  CreateOfferData,
  serializeAcceptedData,
  serializeCreateOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import {
  AcceptedInputName,
  AddressInputName,
  FormId,
  OfferInputName,
} from './attributes'

export interface AcceptOfferFormProps extends CreateOfferData, AcceptedData {
  id: number
  address: EthereumAddress
  children: ReactNode
}

export function AcceptOfferForm(props: AcceptOfferFormProps) {
  const acceptedJson = serializeAcceptedData({
    nonce: props.nonce,
    starkKeyB: props.starkKeyB,
    positionIdB: props.positionIdB,
    submissionExpirationTime: props.submissionExpirationTime,
    premiumCost: props.premiumCost,
  })
  const createdJson = serializeCreateOfferData({
    starkKeyA: props.starkKeyA,
    positionIdA: props.positionIdA,
    syntheticAssetId: props.syntheticAssetId,
    amountCollateral: props.amountCollateral,
    amountSynthetic: props.amountSynthetic,
    aIsBuyingSynthetic: props.aIsBuyingSynthetic,
  })
  return (
    <form
      id={FormId}
      action={`/forced/offers/${props.id}/accept`}
      method="POST"
    >
      <input name={OfferInputName} type="hidden" value={createdJson} />
      <input name={AcceptedInputName} type="hidden" value={acceptedJson} />
      <input
        name={AddressInputName}
        type="hidden"
        value={props.address.toString()}
      />
      {props.children}
    </form>
  )
}
