import { UserDetails } from '@explorer/shared'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  HomeForcedTransactionEntry,
  HomeForcedTransactionTable,
} from '../../components/home/HomeForcedTransactionTable'
import { reactToHtml } from '../../reactToHtml'
import { OFFER_TABLE_PROPS } from './common'

export interface HomeForcedTransactionPageProps {
  user: UserDetails | undefined
  forcedTransactions: HomeForcedTransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeForcedTransactionPage(
  props: HomeForcedTransactionPageProps
) {
  return reactToHtml(<HomeForcedTransactionPage {...props} />)
}

function HomeForcedTransactionPage(props: HomeForcedTransactionPageProps) {
  return (
    <Page
      path={OFFER_TABLE_PROPS.link}
      description="TODO: description"
      user={props.user}
    >
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...OFFER_TABLE_PROPS}
          visible={props.forcedTransactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <HomeForcedTransactionTable
            forcedTransactions={props.forcedTransactions}
          />
        </TableWithPagination>
      </div>
    </Page>
  )
}
