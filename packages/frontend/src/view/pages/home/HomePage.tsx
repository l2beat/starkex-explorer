import { PageContext } from '@explorer/shared'
import React from 'react'

import { Card } from '../../components/Card'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { SearchBar } from '../../components/SearchBar'
import { TablePreview } from '../../components/table/TablePreview'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { PerpetualL2TransactionEntry } from '../l2-transaction/common'
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
import { HomeStatistics, StatisticsEntry } from './components/HomeStatistics'
import {
  DEFAULT_TUTORIALS,
  HomeTutorialEntry,
  HomeTutorials,
} from './components/HomeTutorials'

interface HomePageProps {
  context: PageContext
  tutorials?: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  l2Transactions: PerpetualL2TransactionEntry[]
  forcedTransactions: TransactionEntry[]
  statistics: StatisticsEntry
  offers?: OfferEntry[]
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
      <ContentWrapper className="!max-w-[1340px]">
        <div className="flex flex-col gap-8">
          <div className="-mx-4 flex h-24 items-center justify-center rounded-none bg-gradient-to-b from-brand to-indigo-900 sm:-mx-8 lg:mx-0 lg:rounded-lg">
            <SearchBar
              className="!w-3/4"
              tradingMode={props.context.tradingMode}
            />
          </div>
          <div className="grid gap-x-0 gap-y-8 xl:grid-cols-3 xl:gap-x-8">
            <HomeStatistics
              className={
                tutorials.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'
              }
              statistics={props.statistics}
              showL2Transactions={props.context.showL2Transactions}
            />
            {tutorials.length > 0 && (
              <HomeTutorials tutorials={tutorials} className="hidden xl:flex" />
            )}
          </div>
          <div className="grid grid-cols-1 gap-x-0 gap-y-8 xl:grid-cols-2 xl:gap-x-8 xl:gap-y-0">
            <Card>
              <TablePreview
                viewAllPosition="top"
                visible={props.stateUpdates.length}
                {...STATE_UPDATE_TABLE_PROPS}
              >
                <HomeStateUpdatesTable
                  stateUpdates={props.stateUpdates}
                  shortenOnMobile
                />
              </TablePreview>
            </Card>
            <Card className="flex h-min flex-col gap-[33px] bg-transparent !p-0 xl:bg-gray-800 xl:!p-6">
              {props.context.showL2Transactions && (
                <Card className="xl:p-0">
                  <TablePreview
                    viewAllPosition="top"
                    visible={props.l2Transactions.length}
                    {...L2_TRANSACTIONS_TABLE_PROPS}
                  >
                    <L2TransactionsTable
                      transactions={props.l2Transactions}
                      context={props.context}
                      showInfo={false}
                    />
                  </TablePreview>
                </Card>
              )}
              <Card className="xl:p-0">
                <TablePreview
                  viewAllPosition="top"
                  visible={props.forcedTransactions.length}
                  {...FORCED_TRANSACTION_TABLE_PROPS}
                >
                  <TransactionsTable
                    transactions={props.forcedTransactions}
                    hideAmount
                  />
                </TablePreview>
              </Card>
              {props.offers && props.context.tradingMode === 'perpetual' && (
                <Card className="xl:p-0">
                  <TablePreview
                    viewAllPosition="top"
                    visible={props.offers.length}
                    {...OFFER_TABLE_PROPS}
                  >
                    <OffersTable
                      offers={props.offers}
                      context={props.context}
                    />
                  </TablePreview>
                </Card>
              )}
            </Card>
          </div>
          {tutorials.length > 0 && (
            <HomeTutorials tutorials={tutorials} className="xl:hidden" />
          )}
        </div>
      </ContentWrapper>
    </Page>
  )
}
