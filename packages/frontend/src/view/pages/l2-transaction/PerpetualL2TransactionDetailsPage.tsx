import { PageContext, PerpetualL2TransactionData } from '@explorer/shared'
import React from 'react'

import { AlternativeTransactionIcon } from '../../assets/icons/AlternativeTransactionIcon'
import { Card } from '../../components/Card'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'
import {
  AggregatedPerpetualL2TransactionEntry,
  l2TransactionTypeToText,
} from './common'
import { AlternativeTransactionBanner } from './components/AlternativeTransactionBanner'
import { PerpetualTransactionDetails } from './components/details'
import { L2TransactionsList } from './components/L2TransactionsList'
import { MultiTransactionBanner } from './components/MultiTransactionBanner'
import { ReplacedTransactionBanner } from './components/ReplacedTransactionBanner'

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
  const isMultiOrAlt =
    props.altIndex !== undefined || props.multiIndex !== undefined
  const isReplaced = props.transaction.alternativeTransactions.length > 0

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
            {getPageTitle(
              props.transaction.originalTransaction.type,
              props.transaction.transactionId,
              isMultiOrAlt
            )}
          </PageTitle>
          <span className="h-min rounded-full bg-fuchsia-400 py-2 px-2.5 text-sm font-bold text-black">
            L2 TRANSACTION
          </span>
        </div>
        {(isMultiOrAlt || isReplaced) && (
          <div className="mb-6 flex flex-col gap-1">
            {props.transaction.alternativeTransactions.length > 0 && (
              <ReplacedTransactionBanner />
            )}
            {props.multiIndex !== undefined && (
              <MultiTransactionBanner
                multiIndex={props.multiIndex}
                transactionId={props.transaction.transactionId}
              />
            )}
            {props.altIndex !== undefined && (
              <AlternativeTransactionBanner
                transactionId={props.transaction.transactionId}
                altIndex={props.altIndex}
              />
            )}
          </div>
        )}
        <PerpetualTransactionDetails
          transactionId={props.transaction.transactionId}
          data={props.transaction.originalTransaction}
          stateUpdateId={props.transaction.stateUpdateId}
          collateralAsset={props.context.collateralAsset}
          chainId={props.context.chainId}
          altIndex={props.altIndex}
        />
        {isReplaced && (
          <div className="mt-8">
            <div className="mb-6 flex items-center gap-2">
              <AlternativeTransactionIcon className="fill-cyan-400" />
              <span className="text-xl font-semibold">
                Alternative transactions
              </span>
            </div>
            <Card>
              <L2TransactionsList
                transactions={props.transaction.alternativeTransactions}
                transactionId={props.transaction.transactionId}
                collateralAsset={props.context.collateralAsset}
                contentState="alternative"
              />
            </Card>
          </div>
        )}
      </ContentWrapper>
    </Page>
  )
}

function getPageTitle(
  type: PerpetualL2TransactionData['type'],
  transactionId: number,
  isMultiOrAlt: boolean
) {
  const base = `${l2TransactionTypeToText(type)} transaction `

  return isMultiOrAlt ? base : `${base} #${transactionId}`
}
