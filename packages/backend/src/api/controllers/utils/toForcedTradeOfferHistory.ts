import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../../peripherals/database/ForcedTradeOfferRepository'

interface Event {
  timestamp: Timestamp
  text: string
}

export function toForcedTradeOfferHistory(offer: ForcedTradeOfferRecord) {
  const partyB = offer.isABuyingSynthetic ? 'buyer' : 'seller'
  const history: Event[] = [
    {
      timestamp: offer.createdAt,
      text: `offer created (looking for ${partyB})`,
    },
  ]
  if (offer.accepted) {
    history.push({
      timestamp: offer.accepted.at,
      text: `${partyB} found`,
    })
  }
  if (offer.cancelledAt) {
    history.push({
      timestamp: offer.cancelledAt,
      text: `offer cancelled`,
    })
  }
  return history
}
