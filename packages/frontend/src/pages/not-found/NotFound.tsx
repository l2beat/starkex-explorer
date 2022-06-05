import React from 'react'

import { Page } from '../common/page/Page'
import { NotFoundProps } from './NotFoundProps'

export function NotFound(props: NotFoundProps) {
  return (
    <Page
      title="Not found"
      description={props.text}
      path={props.path}
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
