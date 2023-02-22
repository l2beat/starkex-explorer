import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/page/Page'
import { SearchBar } from '../../components/SearchBar'
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
      <main className="mx-auto w-full max-w-[1024px] xl:max-w-[1236px] flex-1 py-12 px-4 sm:px-8 xl:grid gap-8 xl:grid-cols-[minmax(760px,_1fr)_380px] flex flex-col">
        <div className="flex gap-8 flex-col">
          <SearchBar />
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
        <section className="mb-5 flex flex-col items-baseline gap-2 lg:flex-row xl:mt-[72px]">
          <h2 className="text-xl font-semibold">Tutorials</h2>
          <p className="text-sm font-medium text-zinc-500">
            Learn how to use the StarkEx Explorer
          </p>
        </section>
      </main>
    </Page>
  )
}
