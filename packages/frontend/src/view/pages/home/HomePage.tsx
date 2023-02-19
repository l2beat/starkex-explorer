import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/page/Page'
import { TablePreview } from '../../components/table/TablePreview'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_TABLE_PROPS,
  OFFER_TABLE_PROPS,
  STATE_UPDATE_TABLE_PROPS,
} from './common'
import {
  HomeForcedTransactionEntry,
  HomeForcedTransactionsTable,
} from './components/HomeForcedTransactionsTable'
import { HomeOfferEntry, HomeOffersTable } from './components/HomeOffersTable'
import {
  HomeStateUpdateEntry,
  HomeStateUpdatesTable,
} from './components/HomeStateUpdatesTable'

export interface HomePageProps {
  user: UserDetails | undefined
  // TODO: statistics
  tutorials: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  totalStateUpdate: number
  forcedTransactions: HomeForcedTransactionEntry[]
  totalForcedTransaction: number
  offers: HomeOfferEntry[]
  totalOffers: number
}

export interface HomeTutorialEntry {
  title: string
  imageUrl: string
  href: string
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
      <div className="flex max-w-[760px] flex-col gap-y-12">
        <TablePreview
          {...STATE_UPDATE_TABLE_PROPS}
          visible={props.stateUpdates.length}
          total={props.totalStateUpdate}
        >
          <HomeStateUpdatesTable stateUpdates={props.stateUpdates} />
        </TablePreview>
        <TablePreview
          {...FORCED_TRANSACTION_TABLE_PROPS}
          visible={props.forcedTransactions.length}
          total={props.totalForcedTransaction}
        >
          <HomeForcedTransactionsTable
            forcedTransactions={props.forcedTransactions}
          />
        </TablePreview>
        <TablePreview
          {...OFFER_TABLE_PROPS}
          visible={props.offers.length}
          total={props.totalOffers}
        >
          <HomeOffersTable offers={props.offers} />
        </TablePreview>
      </div>
    </Page>
  )
}
