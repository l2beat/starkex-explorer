import { OfferEntry } from '@explorer/frontend'

import { ForcedTradeOfferRecord } from '../../peripherals/database/ForcedTradeOfferRepository'

function getOfferStatus(
  forcedTradeOffer: ForcedTradeOfferRecord
): OfferEntry['status'] {
  if (forcedTradeOffer.cancelledAt) {
    return 'CANCELLED'
  }
  if (forcedTradeOffer.accepted) {
    return 'ACCEPTED'
  }

  return 'CREATED'
}

export function forcedTradeOfferToEntry(
  forcedTradeOffer: ForcedTradeOfferRecord
): OfferEntry {
  return {
    id: forcedTradeOffer.id.toString(),
    timestamp: forcedTradeOffer.createdAt,
    asset: {
      hashOrId: forcedTradeOffer.syntheticAssetId,
    },
    amount: forcedTradeOffer.syntheticAmount,
    price: 0n, //TODO: calculate price
    totalPrice: 0n * forcedTradeOffer.syntheticAmount,
    status: getOfferStatus(forcedTradeOffer), //TODO: HANDLE SENT STATUS
    type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
  }
}
