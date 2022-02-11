import React from 'react'
import { reactToHtml } from '../reactToHtml'
import { Home } from './Home'

export function renderHomePage() {
  return reactToHtml(<Home />)
}
