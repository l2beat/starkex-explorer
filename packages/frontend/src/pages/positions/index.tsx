import React from 'react'

import { reactToHtml } from '../reactToHtml'
import { PositionDetails } from './PositionDetails'
import { PositionDetailsProps } from './PositionDetailsProps'
import { PositionAtUpdate } from './PositionAtUpdate'
import { PositionAtUpdateProps } from './PositionAtUpdateProps'

export function renderPositionDetailsPage(props: PositionDetailsProps) {
  return reactToHtml(<PositionDetails {...props} />)
}

export function renderPositionAtUpdatePage(props: PositionAtUpdateProps) {
  return reactToHtml(<PositionAtUpdate {...props} />)
}

export type { PositionDetailsProps, PositionAtUpdateProps }
