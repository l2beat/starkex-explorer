import { ForcedTradeOfferEntry } from '@explorer/frontend'
import { AssetId } from '@explorer/types'

import {
  ForcedTradeInitialOfferRecord,
  ForcedTradeOfferRecord,
} from '../../../peripherals/database/ForcedTradeOfferRepository'

function getPriceInUSDCents(
  offer: ForcedTradeInitialOfferRecord | ForcedTradeOfferRecord
) {
  const { amountCollateral, syntheticAssetId, amountSynthetic } = offer
  return (
    (amountCollateral * BigInt(10 ** AssetId.decimals(syntheticAssetId))) /
    amountSynthetic /
    10_000n
  )
}

export function toForcedTradeOfferEntry(
  offer: ForcedTradeInitialOfferRecord | ForcedTradeOfferRecord
): ForcedTradeOfferEntry {
  return {
    id: offer.id,
    type: offer.aIsBuyingSynthetic ? 'buy' : 'sell',
    amount: offer.amountSynthetic,
    assetId: offer.syntheticAssetId,
    positionId: offer.positionIdA,
    price: getPriceInUSDCents(offer),
    total: offer.amountCollateral,
  }
}
