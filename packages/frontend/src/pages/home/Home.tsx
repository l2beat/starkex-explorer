import React from 'react'
import { Page } from '../common'

export function Home() {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <canvas className="absolute z-1 w-full h-full" />
      <h1 className="absolute z-2 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 font-bold text-center text-4xl md:text-[5vw]">
        Under construction
      </h1>
    </Page>
  )
}
