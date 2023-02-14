import { AccountDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../components/common/page/Page'
import { reactToHtml } from '../reactToHtml'

export interface HomePageProps {
  title: string
  account: AccountDetails | undefined
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

function HomePage(props: HomePageProps) {
  return (
    <Page
      path="/"
      description="This explorer allows you to view everything happening on dYdX from the perspective of the Ethereum blockchain. Browse positions, forced transaction and submit your own forced trades and withdrawals."
      account={props.account}
      withoutSearch
    >
      <h1>Home Page: {props.title}</h1>
    </Page>
  )
}
