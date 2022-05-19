import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { ForcedTradeOffersIndex } from './ForcedTradeOffersIndex'
import { ForcedTradeOffersIndexProps } from './ForcedTradeOffersIndexProps'

export * from './ForcedTradeOffersIndexProps'

export function renderForcedTradeOffersIndexPage(
  props: ForcedTradeOffersIndexProps
) {
  return reactToHtml(<ForcedTradeOffersIndex {...props} />)
}
