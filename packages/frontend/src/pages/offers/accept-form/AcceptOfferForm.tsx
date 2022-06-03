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
  FormClass,
  OfferInputName,
} from './attributes'

export interface AcceptOfferFormData extends CreateOfferData, AcceptedData {
  id: number
  address: EthereumAddress
}

interface AcceptOfferFormProps extends AcceptOfferFormData {
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
    collateralAmount: props.collateralAmount,
    syntheticAmount: props.syntheticAmount,
    isABuyingSynthetic: props.isABuyingSynthetic,
  })
  return (
    <form
      className={FormClass}
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
