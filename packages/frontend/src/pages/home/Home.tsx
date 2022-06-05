import React from 'react'

import { SectionHeadingWithLink } from '../common/header/SectionHeadingWithLink'
import { Page } from '../common/page/Page'
import { SearchBar } from '../common/SearchBar'
import { ForcedTransactionsTable } from '../forced-transactions/ForcedTransactionsTable'
import { ForcedTradeOffersTable } from '../offers/ForcedTradeOffersTable'
import { StateUpdatesTable } from '../state-updates/StateUpdatesTable'
import { FreezeButton } from './FreezeButton'
import { HomeProps } from './HomeProps'
import { Stat } from './Stat'
import { tvlElId } from './tvlElId'

export function Home(props: HomeProps) {
  return (
    <Page
      path="/"
      description="This explorer allows you to view everything happening on dYdX from the perspective of the Ethereum blockchain. Browse positions, forced transaction and submit your own forced trades and withdrawals."
      account={props.account}
      withoutSearch
    >
      <SearchBar className="drop-shadow-lg mb-8" />
      <div className="mb-8 flex flex-col md:flex-row gap-x-4 gap-y-1 items-center">
        <Stat title="Total Value Locked" value="-" valueId={tvlElId} />
        <Stat title="State updates" value={props.totalUpdates.toString()} />
        <Stat
          title="Tracked positions"
          value={props.totalPositions.toString()}
        />
        <FreezeButton />
      </div>

      <SectionHeadingWithLink linkUrl="/state-updates" linkText="view all">
        Latest state updates
      </SectionHeadingWithLink>
      <StateUpdatesTable stateUpdates={props.stateUpdates} />

      <SectionHeadingWithLink linkUrl="/forced" linkText="view all">
        Latest forced transactions
      </SectionHeadingWithLink>
      <ForcedTransactionsTable transactions={props.forcedTransactions} />

      <SectionHeadingWithLink linkUrl="/forced/offers" linkText="view all">
        Latest forced trade offers
      </SectionHeadingWithLink>
      <ForcedTradeOffersTable offers={props.forcedTradeOffers} />
    </Page>
  )
}
