import { PageContext } from '@explorer/shared'
import React from 'react'

import { ReplacedIcon } from '../../assets/icons/ReplacedIcon'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { L2MultiOrAlternativeTransactionsTable } from '../../components/tables/l2-transactions/L2MultiOrAlternativeTransactionsTable'
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
        {props.altIndex !== undefined && (
          <div className="mb-4 flex rounded-lg bg-yellow-300 bg-opacity-25 px-6 py-5 text-lg font-semibold">
            <ReplacedIcon className="scale-150 fill-yellow-300" />
            <span className="ml-2 text-yellow-300">Alternative</span>
            <span className="ml-auto">
              Please mind, this transaction is #{props.altIndex} alternative
              transaction of #{props.transaction.transactionId} transaction.
            </span>
          </div>
        )}
        {props.multiIndex !== undefined && (
          <div className="mb-4 flex rounded-lg bg-yellow-300 bg-opacity-25 px-6 py-5 text-lg font-semibold">
            <ReplacedIcon className="scale-150 fill-yellow-300" />
            <span className="ml-2 text-yellow-300">Multi</span>
            <span className="ml-auto">
              This transaction is #{props.multiIndex} transaction of multi
              transaction.
            </span>
          </div>
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
            <L2MultiOrAlternativeTransactionsTable
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
