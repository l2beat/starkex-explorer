import { PageContext } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import {
  L2TransactionEntry,
  L2TransactionsTable,
} from '../../components/tables/L2TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { getL2TransactionTableProps } from './common'
import { UserPageTitle } from './components/UserPageTitle'

export interface UserL2TransactionsPageProps {
  context: PageContext
  starkKey: StarkKey
  l2Transactions: L2TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserL2TransactionsPage(
  props: UserL2TransactionsPageProps
) {
  return reactToHtml(<UserL2TransactionsPage {...props} />)
}

function UserL2TransactionsPage(props: UserL2TransactionsPageProps) {
  const common = getL2TransactionTableProps(props.starkKey)
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
              prefix="L2 transactions of user"
              starkKey={props.starkKey}
            />
          }
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
