import { Timestamp } from '@explorer/types'

import { ForcedTradeOfferRecord } from '../../../peripherals/database/ForcedTradeOfferRepository'

export function toForcedTradeOfferHistory(offer: ForcedTradeOfferRecord): {
  timestamp: Timestamp
  text: string
}[] {
  const partyB = offer.aIsBuyingSynthetic ? 'buyer' : 'seller'
  const history: { timestamp: Timestamp; text: string }[] = [
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
