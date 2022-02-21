import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { PositionDetails } from './PositionDetails'
import { PositionDetailsProps } from './PositionDetailsProps'

export function renderPositionDetailsPage(props: PositionDetailsProps) {
  return reactToHtml(<PositionDetails {...props} />)
}

export type { PositionDetailsProps }
