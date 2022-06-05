import React from 'react'

import { PageHeading } from '../common/header/PageHeading'
import { Page } from '../common/page/Page'
import { ServerPagination } from '../common/pagination'
import { Table } from '../common/table'
import { formatHashLong, formatRelativeTime } from '../formatting'
import { StateUpdatesIndexProps } from './StateUpdatesIndexProps'

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
      <Table
        noRowsText="no state updates have occurred so far"
        columns={[
          { header: 'No.' },
          { header: 'Hash', monospace: true, fullWidth: true },
          { header: 'Time' },
          { header: 'Position updates', numeric: true },
          { header: 'Forced txs', numeric: true },
        ]}
        rows={stateUpdates.map((update) => {
          const link = `/state-updates/${update.id}`
          return {
            link,
            cells: [
              update.id.toString(),
              formatHashLong(update.hash),
              formatRelativeTime(update.timestamp),
              update.positionCount.toString(),
              update.forcedTransactionsCount.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
