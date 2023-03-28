import {
  AcceptedData,
  CreateOfferData,
  serializeAcceptedData,
  serializeCreateOfferData,
} from '@explorer/shared'
import { EthereumAddress } from '@explorer/types'
import React, { ReactNode } from 'react'

export const ACCEPT_OFFER_FORM_ID = 'accept-offer-form'

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
      className={ACCEPT_OFFER_FORM_ID}
      action={`/offers/${props.id}/accept`}
      method="POST"
      data-offer={createdJson}
      data-offer-id={props.id.toString()}
      data-accepted={acceptedJson}
      data-address={props.address.toString()}
    >
      {props.children}
    </form>
  )
}
