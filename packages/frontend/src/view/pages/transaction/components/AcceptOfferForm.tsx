import {
  AcceptOfferFormData,
  serializeAcceptedData,
  serializeCollateralAsset,
  serializeCreateOfferData,
} from '@explorer/shared'
import React, { ReactNode } from 'react'

export const ACCEPT_OFFER_FORM_CLASS = 'accept-offer-form'

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
  const collateralAssetJson = serializeCollateralAsset(props.collateralAsset)
  return (
    <form
      className={ACCEPT_OFFER_FORM_CLASS}
      action={`/offers/${props.id}/accept`}
      method="POST"
      data-offer={createdJson}
      data-offer-id={props.id.toString()}
      data-accepted={acceptedJson}
      data-address={props.address.toString()}
      data-collateral-asset={collateralAssetJson}
    >
      {props.children}
    </form>
  )
}
