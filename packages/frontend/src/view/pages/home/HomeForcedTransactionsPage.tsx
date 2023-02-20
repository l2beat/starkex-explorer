import { UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { OFFER_TABLE_PROPS } from './common'
import {
  HomeForcedTransactionEntry,
  HomeForcedTransactionsTable,
} from './components/HomeForcedTransactionsTable'

export interface HomeForcedTransactionsPageProps {
  user: UserDetails | undefined
  forcedTransactions: HomeForcedTransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeForcedTransactionsPage(
  props: HomeForcedTransactionsPageProps
) {
  return reactToHtml(<HomeForcedTransactionsPage {...props} />)
}

function HomeForcedTransactionsPage(props: HomeForcedTransactionsPageProps) {
  return (
    <Page
      path={OFFER_TABLE_PROPS.link}
      description="TODO: description"
      user={props.user}
    >
      <ContentWrapper>
        <TableWithPagination
          {...OFFER_TABLE_PROPS}
          visible={props.forcedTransactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <HomeForcedTransactionsTable
            forcedTransactions={props.forcedTransactions}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
