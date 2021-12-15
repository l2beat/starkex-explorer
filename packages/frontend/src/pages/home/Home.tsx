import React from 'react'
import { Page } from '../common'

export function Home() {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      image="https://dydx.l2beat.com/images/under-construction.png"
      url="https://dydx.l2beat.com"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <canvas className="Home-Background" />
      <h1 className="Home-Title">Under construction</h1>
    </Page>
  )
}
