import React from 'react'

import { ForcedHistory } from '../common/ForcedHistory'
import { PageHeading } from '../common/header/PageHeading'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { formatHashShort } from '../formatting'
import { ForcedTransactionDetailsProps } from './ForcedTransactionDetailsProps'
import { ForcedTransactionStats } from './ForcedTransactionStats'

export function ForcedTransactionDetails({
  account,
  history,
  transaction,
}: ForcedTransactionDetailsProps) {
  const shortHash = formatHashShort(transaction.data.transactionHash)
  const title = `Forced ${transaction.type} ${shortHash}`
  return (
    <Page
      title={title}
      description="View the details of the forced transaction and a timeline of events from submission to inclusion in a state update."
      path={`/forced/${transaction.data.transactionHash}`}
      account={account}
    >
      <PageHeading>{title}</PageHeading>
      <SectionHeading>Stats</SectionHeading>
      <ForcedTransactionStats transaction={transaction} />
      <ForcedHistory events={history} />
    </Page>
  )
}
