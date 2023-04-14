import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
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
import { UserPageTitle } from './components/UserPageTitle'

export interface UserTransactionsPageProps {
  context: PageContext
  starkKey: StarkKey
  transactions: TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserTransactionsPage(props: UserTransactionsPageProps) {
  return reactToHtml(<UserTransactionsPage {...props} />)
}

function UserTransactionsPage(props: UserTransactionsPageProps) {
  const common = getTransactionTableProps(props.starkKey)
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
            <UserPageTitle
              prefix="Ethereum transactions of"
              starkKey={props.starkKey}
            />
          }
          visible={props.transactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <TransactionsTable transactions={props.transactions} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
