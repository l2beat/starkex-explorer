import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { PositionAssetsTable } from './PositionAssetsTable'
import { PositionDetailsProps } from './PositionDetailsProps'
import { PositionHistoryTable } from './PositionHistoryTable'
import { PositionOffersTable } from './PositionOffersTable'
import { PositionStats } from './PositionStats'
import { PositionTransactionsTable } from './PositionTransactionsTable'

export function PositionDetails(props: PositionDetailsProps) {
  const pendingTransactions = props.transactions.filter(
    (tx) => tx.status === 'sent' || tx.status === 'mined'
  )
  const activeOffers = props.offers.filter(
    (offer) => !offer.cancelledAt && !offer.accepted?.transactionHash
  )

  return (
    <Page
      title={`Position ${props.positionId}`}
      description="View details of this position including all assets, all changes to the position, all associated forced transactions and all associated forced trade offers."
      path={`/positions/${props.positionId}`}
      account={props.account}
    >
      <div className="mb-8 flex items-center">
        <PageHeading className="!mb-0">
          Position {props.positionId.toString()}
        </PageHeading>
        {props.ownedByYou && (
          <span className="ml-4 px-2 bg-blue-100 rounded-full">
            Owned by you
          </span>
        )}
      </div>
      {pendingTransactions.length > 0 && (
        <>
          <SectionHeading active={props.ownedByYou}>
            Pending forced transactions
          </SectionHeading>
          <PositionTransactionsTable transactions={pendingTransactions} />
        </>
      )}
      {activeOffers.length > 0 && (
        <>
          <SectionHeading active={props.ownedByYou}>
            Active forced trade offers
          </SectionHeading>
          <PositionOffersTable offers={activeOffers} />
        </>
      )}

      <SectionHeading>Stats</SectionHeading>
      <PositionStats
        ethAddress={props.ethAddress}
        starkKey={props.starkKey}
        stateUpdateId={props.stateUpdateId}
        lastUpdateTimestamp={props.lastUpdateTimestamp}
      />

      <SectionHeading>Assets</SectionHeading>
      <PositionAssetsTable
        assets={props.assets}
        ownedByYou={props.ownedByYou}
      />

      <SectionHeading>Update history</SectionHeading>
      <PositionHistoryTable
        history={props.history}
        positionId={props.positionId}
      />

      <SectionHeading>Forced transaction history</SectionHeading>
      <PositionTransactionsTable transactions={props.transactions} paginated />

      <SectionHeading>Forced trade offer history</SectionHeading>
      <PositionOffersTable offers={props.offers} paginated />
    </Page>
  )
}
