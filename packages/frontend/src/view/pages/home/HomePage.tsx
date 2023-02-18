import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { reactToHtml } from '../../reactToHtml'

export interface HomePageProps {
  user: UserDetails | undefined
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

function HomePage(props: HomePageProps) {
  return (
    <Page
      path="/"
      description="This explorer allows you to view everything happening on dYdX from the perspective of the Ethereum blockchain. Browse positions, forced transaction and submit your own forced trades and withdrawals."
      user={props.user}
      withoutSearch
    >
      <h1>Home Page</h1>
    </Page>
  )
}
