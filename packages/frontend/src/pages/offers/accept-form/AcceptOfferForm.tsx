import {
  AcceptedData,
  CreateOfferData,
  serializeAcceptedData,
  serializeCreateOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

import { toDataProps } from '../toDataProps'
import { DataAttributes, FormClass } from './attributes'

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
    amountCollateral: props.amountCollateral,
    amountSynthetic: props.amountSynthetic,
    aIsBuyingSynthetic: props.aIsBuyingSynthetic,
  })
  return (
    <form
      className={FormClass}
      action={`/forced/offers/${props.id}/accept`}
      method="POST"
      {...toDataProps({
        [DataAttributes.Offer]: createdJson,
        [DataAttributes.Accepted]: acceptedJson,
        [DataAttributes.Address]: props.address.toString(),
      })}
    >
      {props.children}
    </form>
  )
}
