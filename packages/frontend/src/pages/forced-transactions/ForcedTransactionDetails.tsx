import React from 'react'

import { ForcedHistory } from '../common/ForcedHistory'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { formatHashShort } from '../formatting'
import { FinalizeExitForm } from './finalize-form'
import { ForcedTransactionDetailsProps } from './ForcedTransactionDetailsProps'
import { ForcedTransactionHeader } from './ForcedTransactionHeader'
import { ForcedTransactionStats } from './ForcedTransactionStats'

export function ForcedTransactionDetails({
  account,
  history,
  transaction,
  finalizeForm,
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
      <ForcedTransactionHeader title={title}>
        {finalizeForm && (
          <FinalizeExitForm {...finalizeForm}>
            <button className="bg-blue-100 text-white px-4 py-2 text-base rounded-md">
              Finalize
            </button>
          </FinalizeExitForm>
        )}
      </ForcedTransactionHeader>
      <SectionHeading>Stats</SectionHeading>
      <ForcedTransactionStats transaction={transaction} />
      <ForcedHistory events={history} />
    </Page>
  )
}
