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
import { AlternativeTransactionNote } from './components/AlternativeTransactionNote'
import { PerpetualTransactionDetails } from './components/details'
import { L2TransactionsList } from './components/L2TransactionsList'
import { MultiTransactionNote } from './components/MultiTransactionNote'
import { ReplacedTransactionNote } from './components/ReplacedTransactionNote'

interface PerpetualL2TransactionDetailsPageProps {
  context: PageContext<'perpetual'>
  transaction: AggregatedPerpetualL2TransactionEntry
  altIndex?: number
  multiIndex?: number
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
        {props.multiIndex !== undefined && (
          <MultiTransactionNote multiIndex={props.multiIndex} />
        )}
        {props.altIndex !== undefined && (
          <AlternativeTransactionNote
            transactionId={props.transaction.transactionId}
            altIndex={props.altIndex}
            multiIndex={props.multiIndex}
          />
        )}
        <PerpetualTransactionDetails
          transactionId={props.transaction.transactionId}
          data={props.transaction.originalTransaction}
          stateUpdateId={props.transaction.stateUpdateId}
          collateralAsset={props.context.collateralAsset}
          altIndex={props.altIndex}
        />
        {props.transaction.alternativeTransactions.length > 0 && (
          <div className="mt-12">
            <PageTitle>Alternative transactions</PageTitle>
            <L2TransactionsList
              transactions={props.transaction.alternativeTransactions}
              transactionId={props.transaction.transactionId}
              collateralAsset={props.context.collateralAsset}
              contentState="alternative"
            />
          </div>
        )}
      </ContentWrapper>
    </Page>
  )
}
