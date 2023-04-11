import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { FORCED_TRANSACTION_TABLE_PROPS } from './common'

export interface HomeTransactionsPageProps {
  context: PageContext
  forcedTransactions: TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeTransactionsPage(props: HomeTransactionsPageProps) {
  return reactToHtml(<HomeTransactionsPage {...props} />)
}

function HomeTransactionsPage(props: HomeTransactionsPageProps) {
  return (
    <Page
      path={FORCED_TRANSACTION_TABLE_PROPS.path}
      description="All forced transactions"
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...FORCED_TRANSACTION_TABLE_PROPS}
          visible={props.forcedTransactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <TransactionsTable transactions={props.forcedTransactions} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
