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
import { HomeTutorialEntry, HomeTutorials } from './components/HomeTutorials'

interface HomePageProps {
  context: PageContext
  tutorials: HomeTutorialEntry[]
  stateUpdates: HomeStateUpdateEntry[]
  l2Transactions: PerpetualL2TransactionEntry[]
  forcedTransactions: TransactionEntry[]
  statistics: StatisticsEntry
  offers?: OfferEntry[]
}

export function renderHomePage(props: HomePageProps) {
  return reactToHtml(<HomePage {...props} />)
}

const MAX_TUTORIALS = 2

function HomePage(props: HomePageProps) {
  const showViewAllTutorials = props.tutorials.length > MAX_TUTORIALS

  return (
    <Page
      path="/"
      description="This explorer allows you to view everything happening on dYdX from the perspective of the Ethereum blockchain. Browse positions, forced transaction and submit your own forced trades and withdrawals."
      context={props.context}
      withoutSearch
    >
      <ContentWrapper className="!max-w-[1340px] !pt-0 sm:!pt-8 xl:!pt-16">
        <div className="flex flex-col gap-8">
          <div className="-mx-4 flex h-24 items-center justify-center rounded-none bg-gradient-to-b from-brand to-indigo-900 sm:mx-0 sm:rounded-lg">
            <SearchBar
              className="!w-3/4"
              tradingMode={props.context.tradingMode}
            />
          </div>
          <div className="grid gap-x-0 gap-y-8 xl:grid-cols-3 xl:gap-x-8">
            <HomeStatistics
              className={
                props.tutorials.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'
              }
              statistics={props.statistics}
              showL2Transactions={props.context.showL2Transactions}
            />
            {props.tutorials.length > 0 && (
              <HomeTutorials
                tutorials={props.tutorials.slice(0, MAX_TUTORIALS)}
                showViewAll={showViewAllTutorials}
                className="hidden xl:flex"
              />
            )}
          </div>
          <Tables {...props} />
          {props.tutorials.length > 0 && (
            <HomeTutorials
              tutorials={props.tutorials.slice(0, MAX_TUTORIALS)}
              showViewAll={showViewAllTutorials}
              className="xl:hidden"
            />
          )}
        </div>
      </ContentWrapper>
    </Page>
  )
}

function Tables(props: HomePageProps) {
  const secondColumnTables = [
    ...(props.context.showL2Transactions
      ? [
          <TablePreview
            viewAllPosition="top"
            visible={props.l2Transactions.length}
            {...L2_TRANSACTIONS_TABLE_PROPS}
          >
            <L2TransactionsTable
              transactions={props.l2Transactions}
              context={props.context}
              showInfo={false}
              isHomePage
            />
          </TablePreview>,
        ]
      : []),
    <TablePreview
      viewAllPosition="top"
      visible={props.forcedTransactions.length}
      {...FORCED_TRANSACTION_TABLE_PROPS}
    >
      <TransactionsTable
        transactions={props.forcedTransactions}
        hideInfo
        isHomePage
      />
    </TablePreview>,
    ...(props.offers && props.context.tradingMode === 'perpetual'
      ? [
          <TablePreview
            viewAllPosition="top"
            visible={props.offers.length}
            {...OFFER_TABLE_PROPS}
          >
            <OffersTable
              offers={props.offers}
              context={props.context}
              showTypeColumn
              isHomePage
            />
          </TablePreview>,
        ]
      : []),
  ]

  return (
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
      <Card className="hidden flex-col gap-[30px] xl:flex">
        {...secondColumnTables}
      </Card>
      {secondColumnTables.map((table, i) => {
        return (
          <Card className="xl:hidden" key={i}>
            {table}
          </Card>
        )
      })}
    </div>
  )
}
