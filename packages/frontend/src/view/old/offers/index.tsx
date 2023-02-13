import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { ForcedTradeOfferDetails } from './ForcedTradeOfferDetails'
import { ForcedTradeOfferDetailsProps } from './ForcedTradeOfferDetailsProps'
import { ForcedTradeOffersIndex } from './ForcedTradeOffersIndex'
import { ForcedTradeOffersIndexProps } from './ForcedTradeOffersIndexProps'

export * from './ForcedTradeOfferDetailsProps'
export * from './ForcedTradeOffersIndexProps'

export function renderForcedTradeOffersIndexPage(
  props: ForcedTradeOffersIndexProps
) {
  return reactToHtml(<ForcedTradeOffersIndex {...props} />)
}

export function renderForcedTradeOfferDetailsPage(
  props: ForcedTradeOfferDetailsProps
) {
  return reactToHtml(<ForcedTradeOfferDetails {...props} />)
}
