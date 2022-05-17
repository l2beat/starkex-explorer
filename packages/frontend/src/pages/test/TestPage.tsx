import React from 'react'
import { Page } from '../common'
import { TestPageProps } from './TestPageProps'

export function TestPage({ account }: TestPageProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <div className="flex flex-col gap-6">
        <button data-account={account} id="eth_sign" className="p-2 bg-blue-100">
          ETH Sign
        </button>
        <button id="personal_sign" className="p-2 bg-blue-100">
          Personal Sign
        </button>
      </div>
    </Page>
  )
}
