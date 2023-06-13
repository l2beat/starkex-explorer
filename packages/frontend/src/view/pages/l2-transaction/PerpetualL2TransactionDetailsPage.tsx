import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'
import {
  AggregatedPerpetualL2TransactionEntry,
  l2TransactionTypeToText,
} from './common'
import { PerpetualTransactionDetails } from './components/details'
import { ReplacedTransactionNote } from './components/ReplacedTransactionNote'

interface PerpetualL2TransactionDetailsPageProps {
  context: PageContext<'perpetual'>
  transaction: AggregatedPerpetualL2TransactionEntry
}

export function renderPerpetualL2TransactionDetailsPage(
  props: PerpetualL2TransactionDetailsPageProps
) {
  return reactToHtml(<PerpetualL2TransactionDetailsPage {...props} />)
}

export function PerpetualL2TransactionDetailsPage(
  props: PerpetualL2TransactionDetailsPageProps
) {
  return (
    <Page
      context={props.context}
      description={`Details of ${l2TransactionTypeToText(
        props.transaction.originalTransaction.type
      )} l2 transaction`}
      path="/l2-transactions/:transactionId"
    >
      <ContentWrapper className="flex flex-col">
        <div className="flex gap-3">
          <PageTitle>
            {l2TransactionTypeToText(
              props.transaction.originalTransaction.type
            )}{' '}
            transaction #{props.transaction.transactionId}
          </PageTitle>
          <span className="h-min rounded-full bg-fuchsia-400 py-2 px-2.5 text-sm font-bold text-black">
            L2 TRANSACTION
          </span>
        </div>
        {props.transaction.alternativeTransactions.length > 0 && (
          <ReplacedTransactionNote />
        )}
        <PerpetualTransactionDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.originalTransaction}
          collateralAsset={props.context.collateralAsset}
        />
        {props.transaction.alternativeTransactions.length > 0 && (
          <div className="mt-12">
            <PageTitle>Alternative transactions</PageTitle>
            {props.transaction.alternativeTransactions.map((tx, index) => (
              <div className="mb-4" key={`${tx.type}${index}`}>
                <span className="text-lg font-semibold">
                  {l2TransactionTypeToText(tx.type)} alternative transaction #
                  {index}
                </span>
                <PerpetualTransactionDetails
                  stateUpdateId={props.transaction.stateUpdateId}
                  data={tx}
                  collateralAsset={props.context.collateralAsset}
                />
              </div>
            ))}
          </div>
        )}
      </ContentWrapper>
    </Page>
  )
}
