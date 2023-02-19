import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  UserTransactionEntry,
  UserTransactionTable,
} from '../../components/user/UserTransactionTable'
import { reactToHtml } from '../../reactToHtml'
import { getTransactionTableProps } from './common'

export interface UserTransactionPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  transactions: UserTransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserTransactionPage(props: UserTransactionPageProps) {
  return reactToHtml(<UserTransactionPage {...props} />)
}

function UserTransactionPage(props: UserTransactionPageProps) {
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
          <UserTransactionTable transactions={props.transactions} />
        </TableWithPagination>
      </div>
    </Page>
  )
}
