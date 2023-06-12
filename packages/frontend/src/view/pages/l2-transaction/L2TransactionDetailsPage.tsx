import { CollateralAsset, PageContext } from '@explorer/shared'
import React from 'react'

import { Link } from '../../components/Link'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { StatusBadge } from '../../components/StatusBadge'
import { L2TransactionEntry } from '../../components/tables/L2TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { getL2StatusBadgeValues, l2TransactionTypeToText } from './common'
import { ConditionalTransferDetails } from './components/ConditionalTransferDetails'
import { DepositDetails } from './components/DepositDetails'
import { ForcedWithdrawalDetails } from './components/ForcedWithdrawalDetails'
import { TransferDetails } from './components/TransferDetails'
import { WithdrawToAddressDetails } from './components/WithdrawToAddress'

interface L2TransactionDetailsPageProps {
  context: PageContext<'perpetual'>
  transaction: L2TransactionEntry
}

export function renderL2TransactionDetailsPage(
  props: L2TransactionDetailsPageProps
) {
  return reactToHtml(<L2TransactionDetailsPage {...props} />)
}

export function L2TransactionDetailsPage(props: L2TransactionDetailsPageProps) {
  return (
    <Page
      context={props.context}
      description={`Details of ${l2TransactionTypeToText(
        props.transaction.data.type
      )} l2 transaction`}
      path="/l2-transactions/:transactionId"
    >
      <ContentWrapper className="flex flex-col">
        <div className="flex gap-3">
          <PageTitle>
            {l2TransactionTypeToText(props.transaction.data.type)} transaction #
            {props.transaction.transactionId}
          </PageTitle>
          <span className="h-min rounded-full bg-amber-500 px-2 py-1">
            L2 TRANSACTION
          </span>
        </div>
        <L2TransactionDetails
          transaction={props.transaction}
          collateralAsset={props.context.collateralAsset}
        />
      </ContentWrapper>
    </Page>
  )
}

interface L2TransactionDetailsProps {
  transaction: L2TransactionEntry
  collateralAsset: CollateralAsset
}

function L2TransactionDetails(props: L2TransactionDetailsProps) {
  switch (props.transaction.data.type) {
    case 'Deposit':
      return (
        <DepositDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.collateralAsset}
        />
      )
    case 'ForcedWithdrawal':
      return (
        <ForcedWithdrawalDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.collateralAsset}
        />
      )
    case 'Transfer':
      return (
        <TransferDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.collateralAsset}
        />
      )
    case 'WithdrawToAddress':
      return (
        <WithdrawToAddressDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.collateralAsset}
        />
      )
    case 'ConditionalTransfer':
      return (
        <ConditionalTransferDetails
          stateUpdateId={props.transaction.stateUpdateId}
          data={props.transaction.data}
          collateralAsset={props.collateralAsset}
        />
      )
    default:
      return null
  }
}

export function L2CurrentStatusValue(props: {
  stateUpdateId: number | undefined
}) {
  const statusBadgeValues = getL2StatusBadgeValues(props.stateUpdateId)
  return (
    <div className="flex items-center gap-1">
      <StatusBadge type={statusBadgeValues.type}>
        {statusBadgeValues.text}
      </StatusBadge>
      {props.stateUpdateId !== undefined ? (
        <span>
          Transaction included in state update{' '}
          <Link href={`/state-updates/${props.stateUpdateId}`}>
            #{props.stateUpdateId}
          </Link>
        </span>
      ) : (
        'Transaction created'
      )}
    </div>
  )
}
