import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { Page } from '../common/page/Page'
import { ServerPagination } from '../common/pagination'
import { ForcedTransactionsIndexProps } from './ForcedTransactionsIndexProps'
import { ForcedTransactionsTable } from './ForcedTransactionsTable'

export function ForcedTransactionsIndex({
  transactions,
  params: { perPage, page },
  total,
  account,
}: ForcedTransactionsIndexProps) {
  return (
    <Page
      title="Forced transaction list"
      description="Browse the list of all forced transactions including withdrawals and trades."
      path="/forced"
      account={account}
    >
      <PageHeading>Latest forced transactions</PageHeading>
      <ServerPagination
        perPage={perPage}
        page={page}
        total={total}
        baseUrl="/forced"
      />
      <ForcedTransactionsTable transactions={transactions} />
    </Page>
  )
}
