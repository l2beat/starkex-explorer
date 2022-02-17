import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { StateChangeDetailsProps } from './StateChangeDetailsProps'
import { StateChangeDetails } from './StateChangeDetails'

export function renderStateChangeDetailsPage(props: StateChangeDetailsProps) {
  return reactToHtml(<StateChangeDetails {...props} />)
}

export type { StateChangeDetailsProps }
