import { PageContext } from '@explorer/shared'
import cx from 'classnames'
import React from 'react'

import { Page } from '../../components/page/Page'
import { SearchBar } from '../../components/SearchBar'
import { TablePreview } from '../../components/table/TablePreview'
import {
  L2TransactionEntry,
  L2TransactionsTable,
} from '../../components/tables/L2TransactionsTable'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_TABLE_PROPS,
  L2_TRANSACTIONS_TABLE_PROPS,
  OFFER_TABLE_PROPS,
  STATE_UPDATE_TABLE_PROPS,
} from './common'
import {
  HomeStateUpdateEntry,
  HomeStateUpdatesTable,
} from './components/HomeStateUpdatesTable'
import {
  DEFAULT_TUTORIALS,
  HomeTutorialEntry,
  HomeTutorials,
} from './components/HomeTutorials'

interface HomePageProps {
  context: PageContext
  // TODO: statistics
  tutorials?: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  totalStateUpdates: number
  l2Transactions?: {
    data: L2TransactionEntry[]
    total: number
  }
  forcedTransactions: TransactionEntry[]
  totalForcedTransactions: number
  offers?: OfferEntry[]
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
      context={props.context}
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
          <SearchBar tradingMode={props.context.tradingMode} />
          {props.l2Transactions && (
            <TablePreview
              {...L2_TRANSACTIONS_TABLE_PROPS}
              visible={props.l2Transactions.data.length}
              total={props.l2Transactions.total}
            >
              <L2TransactionsTable transactions={props.l2Transactions.data} />
            </TablePreview>
          )}
          <TablePreview
            {...STATE_UPDATE_TABLE_PROPS}
            visible={props.stateUpdates.length}
            total={props.totalStateUpdates}
          >
            <HomeStateUpdatesTable stateUpdates={props.stateUpdates} />
          </TablePreview>
          <TablePreview
            {...FORCED_TRANSACTION_TABLE_PROPS}
            visible={props.forcedTransactions.length}
            total={props.totalForcedTransactions}
          >
            <TransactionsTable transactions={props.forcedTransactions} />
          </TablePreview>
          {props.offers && props.context.tradingMode === 'perpetual' && (
            <TablePreview
              {...OFFER_TABLE_PROPS}
              visible={props.offers.length}
              total={props.totalOffers}
            >
              <OffersTable
                showStatus
                offers={props.offers}
                context={props.context}
              />
            </TablePreview>
          )}
        </div>
        {tutorials.length > 0 && <HomeTutorials tutorials={tutorials} />}
      </main>
    </Page>
  )
}
