import { PageContext } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/page/Page'
import { reactToHtml } from '../reactToHtml'

export interface NotFoundPageProps {
  context: PageContext
}

export function renderNotFoundPage(props: NotFoundPageProps) {
  return reactToHtml(<NotFoundPage {...props} />)
}

function NotFoundPage(props: NotFoundPageProps) {
  return (
    <Page
      path="/"
      description="Not found."
      context={props.context}
      withoutSearch
    >
      <h1>Not found</h1>
    </Page>
  )
}
