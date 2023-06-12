import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../../components/page/ContentWrapper'
import { Page } from '../../../components/page/Page'
import { PageTitle } from '../../../components/PageTitle'
import { reactToHtml } from '../../../reactToHtml'
import {
  PerpetualL2TransactionEntry,
  perpetualL2TransactionTypeToText,
} from '../common'
import { PerpetualTransactionDetails } from './components/details'

interface PerpetualL2TransactionDetailsPageProps {
  context: PageContext<'perpetual'>
  transaction: PerpetualL2TransactionEntry
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
      description={`Details of ${perpetualL2TransactionTypeToText(
        props.transaction.data.type
      )} l2 transaction`}
      path="/l2-transactions/:transactionId"
    >
      <ContentWrapper className="flex flex-col">
        <div className="flex gap-3">
          <PageTitle>
            {perpetualL2TransactionTypeToText(props.transaction.data.type)}{' '}
            transaction #{props.transaction.transactionId}
          </PageTitle>
        </div>
        <PerpetualTransactionDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.context.collateralAsset}
        />
      </ContentWrapper>
    </Page>
  )
}
