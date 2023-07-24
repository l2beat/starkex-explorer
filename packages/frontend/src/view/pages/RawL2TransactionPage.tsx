import { PageContext, toJsonWithoutBigInts } from '@explorer/shared'
import React from 'react'

import { Card } from '../components/Card'
import { ContentWrapper } from '../components/page/ContentWrapper'
import { Page } from '../components/page/Page'
import { PageTitle } from '../components/PageTitle'
import { reactToHtml } from '../reactToHtml'
import {
  AggregatedPerpetualL2TransactionEntry,
  l2TransactionTypeToText,
} from './l2-transaction/common'
import { ReplacedTransactionBanner } from './l2-transaction/components/ReplacedTransactionBanner'

interface RawL2TransactionPageProps {
  context: PageContext<'perpetual'>
  transaction: AggregatedPerpetualL2TransactionEntry
}

export function renderRawL2TransactionPage(props: RawL2TransactionPageProps) {
  return reactToHtml(<RawL2TransactionPage {...props} />)
}

export function RawL2TransactionPage(props: RawL2TransactionPageProps) {
  const isReplaced = props.transaction.alternativeTransactions.length > 0
  const { transactionId, stateUpdateId, ...transactionData } = props.transaction
  return (
    <Page
      context={props.context}
      description={`Raw details of ${l2TransactionTypeToText(
        props.transaction.originalTransaction.type
      )} l2 transaction`}
      path="/raw-l2-transactions/:transactionId"
    >
      <ContentWrapper className="flex !max-w-6xl flex-col">
        <div className="flex gap-3">
          <PageTitle>{`Raw data of transaction #${props.transaction.transactionId}`}</PageTitle>
          <span className="h-min rounded-full bg-fuchsia-400 py-2 px-2.5 text-sm font-bold text-black">
            L2 TRANSACTION
          </span>
        </div>
        {isReplaced && (
          <div className="mb-6 flex flex-col gap-1">
            {props.transaction.alternativeTransactions.length > 0 && (
              <ReplacedTransactionBanner />
            )}
          </div>
        )}
        <Card>
          <pre className="whitespace-pre-wrap">
            {toJsonWithoutBigInts(transactionData, 2)}
          </pre>
        </Card>
      </ContentWrapper>
    </Page>
  )
}
