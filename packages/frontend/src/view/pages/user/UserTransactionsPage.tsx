import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getTransactionTableProps } from './common'
import {
  UserTransactionEntry,
  UserTransactionsTable,
} from './components/UserTransactionsTable'

export interface UserTransactionsPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  transactions: UserTransactionEntry[]
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
    <Page path={common.link} description="TODO: description" user={props.user}>
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...common}
          // TODO: override title
          visible={props.transactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserTransactionsTable transactions={props.transactions} />
        </TableWithPagination>
      </div>
    </Page>
  )
}
