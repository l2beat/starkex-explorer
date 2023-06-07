import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import {
  L2TransactionEntry,
  L2TransactionsTable,
} from '../../components/tables/L2TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { L2_TRANSACTIONS_TABLE_PROPS } from './common'

export interface HomeL2TransactionsPageProps {
  context: PageContext
  l2Transactions: L2TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderHomeL2TransactionsPage(
  props: HomeL2TransactionsPageProps
) {
  return reactToHtml(<HomeL2TransactionsPage {...props} />)
}

function HomeL2TransactionsPage(props: HomeL2TransactionsPageProps) {
  return (
    <Page
      path={L2_TRANSACTIONS_TABLE_PROPS.path}
      description="Latest state updates"
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...L2_TRANSACTIONS_TABLE_PROPS}
          visible={props.l2Transactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <L2TransactionsTable transactions={props.l2Transactions} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
