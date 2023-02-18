import { AccountDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/common/page/Page'
import { reactToHtml } from '../reactToHtml'

export interface NotFoundPageProps {
  account: AccountDetails | undefined
}

export function renderNotFoundPage(props: NotFoundPageProps) {
  return reactToHtml(<NotFoundPage {...props} />)
}

function NotFoundPage(props: NotFoundPageProps) {
  return (
    <Page path="/" description="Not found." user={props.account} withoutSearch>
      <h1>Not found</h1>
    </Page>
  )
}
