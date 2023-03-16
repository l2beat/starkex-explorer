import { OfferEntry } from '@explorer/frontend'
import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../peripherals/database/ForcedTradeOfferRepository'

function getOfferStatus(forcedTradeOffer: ForcedTradeOfferRecord) {
  if (forcedTradeOffer.accepted) {
    if (forcedTradeOffer.accepted.transactionHash) {
      return 'SENT'
    }
    if (
      Timestamp.fromHours(forcedTradeOffer.accepted.submissionExpirationTime) <
      Timestamp.now()
    ) {
      return 'EXPIRED'
    }
  }

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
    status: getOfferStatus(forcedTradeOffer),
    type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
  }
}
