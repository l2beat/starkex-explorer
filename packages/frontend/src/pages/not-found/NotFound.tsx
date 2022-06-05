import React from 'react'

import { Page } from '../common/page/Page'
import { NotFoundProps } from './NotFoundProps'

export function NotFound(props: NotFoundProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={props.account}
      withoutSearch
    >
      <div className="text-center">
        <h1 className="text-2xl">{props.text}</h1>
        <div className="text-[40vw] sm:text-[250px] font-bold text-grey-300">
          404
        </div>
      </div>
    </Page>
  )
}
