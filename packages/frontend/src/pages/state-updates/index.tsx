import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { StateUpdateDetails } from './StateUpdateDetails'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { StateUpdatesIndex } from './StateUpdatesIndex'
import { StateUpdatesIndexProps } from './StateUpdatesIndexProps'

export function renderStateUpdateDetailsPage(props: StateUpdateDetailsProps) {
  return reactToHtml(<StateUpdateDetails {...props} />)
}

export function renderStateUpdatesIndexPage(props: StateUpdatesIndexProps) {
  return reactToHtml(<StateUpdatesIndex {...props} />)
}

export type { StateUpdateDetailsProps, StateUpdatesIndexProps }
