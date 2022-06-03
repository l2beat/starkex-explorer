import { CreateOfferData } from './CreateOfferData'

export function toSignableCreateOffer(offer: CreateOfferData) {
  return JSON.stringify(
    {
      starkKeyA: offer.starkKeyA,
      positionIdA: offer.positionIdA.toString(),
      syntheticAssetId: offer.syntheticAssetId,
      collateralAmount: offer.collateralAmount.toString(),
      syntheticAmount: offer.syntheticAmount.toString(),
      aIsBuyingSynthetic: offer.aIsBuyingSynthetic,
    },
    null,
    2
  )
}
