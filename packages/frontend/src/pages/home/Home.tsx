import { Timestamp } from '@explorer/types'
import React from 'react'

import { SectionHeadingWithLink } from '../common/header/SectionHeadingWithLink'
import { Page } from '../common/page/Page'
import { SearchBar } from '../common/SearchBar'
import { ForcedTransactionsTable } from '../forced-transactions/ForcedTransactionsTable'
import { ActionsTable } from '../newUser/ActionsTable'
import { AssetsTable } from '../newUser/AssetsTable'
import { BalanceChangesTable } from '../newUser/BalanceChangesTable'
import { EthereumTransactionsTable } from '../newUser/EthereumTransactionsTable'
import { OffersTable } from '../newUser/OffersTable'
import { UserProfile } from '../newUser/UserProfile'
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
      <UserProfile ethereumAddress={props.account?.address} />
      <ActionsTable withdrawableAssets={[{icon: 'Icon', symbol: 'BTC', amount: 5 as unknown as bigint}]} offersToAccept={[{timestamp: Timestamp.now(), asset: 'BTC', assetIcon: '', amount: 3 as unknown as bigint, price: 17 as unknown as bigint, status: 'CREATED', type: 'BUY'}]} />
      <AssetsTable assets={[{icon: 'Icon', name: 'Bitcoin', symbol: 'BTC', balance: 1 as unknown as bigint, value: 2 as unknown as bigint, vaultId: 17, action: "CLOSE"}]} />
      <BalanceChangesTable balanceChanges={[{timestamp: Timestamp.now(), stateUpdateId: 27, asset: 'BTC', assetIcon: 'I', newBalance: 1 as unknown as bigint, change: 2 as unknown as bigint, vaultId: 17}]} />
      <EthereumTransactionsTable ethereumTransactions={[{timestamp: Timestamp.now(), hash: '0x63427846783fjhsgdgfuyt2', asset: 'BTC', amount: 1 as unknown as bigint, assetIcon: '', status: 'MINED (2/3)', type: 'Forced sell'}]} />
      <OffersTable offers={[{timestamp: Timestamp.now(), asset: 'BTC', assetIcon: '', amount: 3 as unknown as bigint, price: 17 as unknown as bigint, status: 'CREATED', type: 'BUY'}]} />
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
