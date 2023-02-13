import React from 'react'

import { reactToHtml } from '../../reactToHtml'
import { Home } from './Home'
import { HomeProps } from './HomeProps'

export * from './HomeProps'

export function renderOldHomePage(props: HomeProps) {
  return reactToHtml(<Home {...props} />)
}
