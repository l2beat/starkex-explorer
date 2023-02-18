import { UserDetails } from '@explorer/shared'
import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assetUtils'
import { Page } from '../../components/common/page/Page'
import {
  HomeStateUpdateEntry,
  HomeStateUpdateTable,
} from '../../components/home/HomeStateUpdateTable'
import { reactToHtml } from '../../reactToHtml'

export interface HomePageProps {
  user: UserDetails | undefined
  // TODO: statistics
  tutorials: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  stateUpdateCount: number
  forcedTransactions: HomeForcedTransactionEntry[]
  forcedTransactionCount: number
  offers: HomeOfferEntry[]
  offerCount: number
}

export interface HomeTutorialEntry {
  title: string
  imageUrl: string
  href: string
}

export interface HomeForcedTransactionEntry {
  timestamp: Timestamp
  hash: Hash256
  asset: Asset
  amount: bigint
  status: 'MINED' | 'INCLUDED'
  type: 'WITHDRAWAL' | 'BUY' | 'SELL'
}

export interface HomeOfferEntry {
  timestamp: Timestamp
  id: string
  asset: Asset
  amount: bigint
  price: bigint
  totalPrice: bigint
  type: 'BUY' | 'SELL'
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
      <HomeStateUpdateTable stateUpdates={props.stateUpdates} />
    </Page>
  )
}
