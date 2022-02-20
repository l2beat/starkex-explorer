import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { StateChangeDetails } from './StateChangeDetails'
import { StateChangeDetailsProps } from './StateChangeDetailsProps'
import { StateChangesIndex } from './StateChangesIndex'
import { StateChangesIndexProps } from './StateChangesIndexProps'

export function renderStateChangeDetailsPage(props: StateChangeDetailsProps) {
  return reactToHtml(<StateChangeDetails {...props} />)
}

export function renderStateChangesIndexPage(props: StateChangesIndexProps) {
  return reactToHtml(<StateChangesIndex {...props} />)
}

export type { StateChangeDetailsProps, StateChangesIndexProps }
