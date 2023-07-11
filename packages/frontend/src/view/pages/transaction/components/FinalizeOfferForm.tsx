import {
  FinalizeOfferFormData,
  serializeCollateralAsset,
  serializeFinalizeOfferData,
} from '@explorer/shared'
import React, { ReactNode } from 'react'

export const FINALIZE_OFFER_FORM_CLASS = 'finalize-offer-form'

interface FinalizeOfferFormProps extends FinalizeOfferFormData {
  children: ReactNode
}

export function FinalizeOfferForm(props: FinalizeOfferFormProps) {
  const { address, perpetualAddress, offerId, collateralAsset, ...offer } =
    props
  const offerJson = serializeFinalizeOfferData(offer)
  const collateralAssetJson = serializeCollateralAsset(collateralAsset)
  return (
    <form
      className={FINALIZE_OFFER_FORM_CLASS}
      action="/forced/trades"
      method="POST"
      data-offer-id={offerId.toString()}
      data-offer={offerJson}
      data-address={address.toString()}
      data-perpetual-address={perpetualAddress.toString()}
      data-collateral-asset={collateralAssetJson}
    >
      {props.children}
    </form>
  )
}
