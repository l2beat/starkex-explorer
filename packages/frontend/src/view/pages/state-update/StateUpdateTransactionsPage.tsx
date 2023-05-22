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
import { getTransactionTableProps } from './common'
import { StateUpdatePageTitle } from './components/StateUpdatePageTitle'

interface StateUpdateTransactionsPageProps {
  context: PageContext
  id: string
  transactions: TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderStateUpdateTransactionsPage(
  props: StateUpdateTransactionsPageProps
) {
  return reactToHtml(<StateUpdateTransactionsPage {...props} />)
}

function StateUpdateTransactionsPage(props: StateUpdateTransactionsPageProps) {
  const common = getTransactionTableProps(props.id)
  return (
    <Page
      path={common.path}
      description={common.description}
      context={props.context}
    >
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={
            <StateUpdatePageTitle
              prefix="Included transactions of"
              id={props.id}
            />
          }
          visible={props.transactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <TransactionsTable hideTime transactions={props.transactions} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
