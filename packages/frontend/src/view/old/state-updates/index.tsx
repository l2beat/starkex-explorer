import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { StateUpdateDetails } from './StateUpdateDetails'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { StateUpdatesIndex } from './StateUpdatesIndex'
import { StateUpdatesIndexProps } from './StateUpdatesIndexProps'

export * from './StateUpdateDetailsProps'
export * from './StateUpdatesIndexProps'

export function renderOldStateUpdateDetailsPage(
  props: StateUpdateDetailsProps
) {
  return reactToHtml(<StateUpdateDetails {...props} />)
}

export function renderOldStateUpdatesIndexPage(props: StateUpdatesIndexProps) {
  return reactToHtml(<StateUpdatesIndex {...props} />)
}
