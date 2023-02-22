import { UserDetails } from '@explorer/shared'
import cx from 'classnames'
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
import {
  DEFAULT_TUTORIALS,
  HomeTutorialEntry,
  HomeTutorials,
} from './components/HomeTutorials'

export interface HomePageProps {
  user: UserDetails | undefined
  // TODO: statistics
  tutorials?: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  totalStateUpdate: number
  forcedTransactions: HomeForcedTransactionEntry[]
  totalForcedTransaction: number
  offers: HomeOfferEntry[]
  totalOffers: number
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

function HomePage(props: HomePageProps) {
  const tutorials = props.tutorials ?? DEFAULT_TUTORIALS

  return (
    <Page
      path="/"
      description="This explorer allows you to view everything happening on dYdX from the perspective of the Ethereum blockchain. Browse positions, forced transaction and submit your own forced trades and withdrawals."
      user={props.user}
      withoutSearch
    >
      <main
        className={cx(
          'mx-auto flex w-full max-w-[1024px] flex-1 flex-col gap-8 py-12 px-4 sm:px-8',
          tutorials.length > 0 &&
            'xl:grid xl:max-w-[1236px] xl:grid-cols-[minmax(760px,_1fr)_380px]'
        )}
      >
        <div className="flex flex-col gap-8">
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
        {tutorials.length > 0 && <HomeTutorials tutorials={tutorials} />}
      </main>
    </Page>
  )
}
