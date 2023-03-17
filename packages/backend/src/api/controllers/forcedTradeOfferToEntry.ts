import { OfferEntry } from '@explorer/frontend'
import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../peripherals/database/ForcedTradeOfferRepository'

function buildTradeOfferHistory(
  forcedTradeOffer: ForcedTradeOfferRecord
): OfferEntry['status'][] {
  const history: OfferEntry['status'][] = []
  if (forcedTradeOffer.accepted) {
    if (forcedTradeOffer.accepted.transactionHash) {
      history.push('SENT')
    } else if (
      Timestamp.fromHours(forcedTradeOffer.accepted.submissionExpirationTime) <
      Timestamp.now()
    ) {
      history.push('EXPIRED')
    }
  }

  if (forcedTradeOffer.cancelledAt) {
    history.push('CANCELLED')
  }

  if (forcedTradeOffer.accepted) {
    history.push('ACCEPTED')
  }

  history.push('CREATED')

  return history
}

export function forcedTradeOfferToEntry(
  forcedTradeOffer: ForcedTradeOfferRecord
): OfferEntry {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const status = buildTradeOfferHistory(forcedTradeOffer)[0]!
  return {
    id: forcedTradeOffer.id.toString(),
    timestamp: forcedTradeOffer.createdAt,
    asset: {
      hashOrId: forcedTradeOffer.syntheticAssetId,
    },
    amount: forcedTradeOffer.syntheticAmount,
    price: 0n, //TODO: calculate price
    totalPrice: 0n * forcedTradeOffer.syntheticAmount,
    status,
    type: forcedTradeOffer.isABuyingSynthetic ? 'BUY' : 'SELL',
  }
}
