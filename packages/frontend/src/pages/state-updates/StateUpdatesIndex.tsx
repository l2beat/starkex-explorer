import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { Page } from '../common/page/Page'
import { ServerPagination } from '../common/pagination'
import { StateUpdatesIndexProps } from './StateUpdatesIndexProps'
import { StateUpdatesTable } from './StateUpdatesTable'

export function StateUpdatesIndex({
  stateUpdates,
  params: { perPage, page },
  total,
  account,
}: StateUpdatesIndexProps) {
  return (
    <Page
      title="State update list"
      description="Browse the list of all state updates of the dYdX rollup."
      path="/state-updates"
      account={account}
    >
      <PageHeading>Latest state updates</PageHeading>
      <ServerPagination
        perPage={perPage}
        page={page}
        total={total}
        baseUrl="/state-updates"
      />
      <StateUpdatesTable stateUpdates={stateUpdates} />
    </Page>
  )
}
