import React from 'react'
import { reactToHtml } from '../util'
import { Home } from './Home'

export function renderHomePage() {
  return reactToHtml(<Home />)
}
