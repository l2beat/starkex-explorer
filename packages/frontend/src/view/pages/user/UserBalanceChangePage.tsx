import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TableWithPagination } from '../../components/common/table/TableWithPagination'
import {
  UserBalanceChangeEntry,
  UserBalanceChangeTable,
} from '../../components/user/UserBalanceChangeTable'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps } from './common'

export interface UserBalanceChangePageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  type: 'SPOT' | 'PERPETUAL'
  balanceChanges: UserBalanceChangeEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserBalanceChangePage(props: UserBalanceChangePageProps) {
  return reactToHtml(<UserBalanceChangePage {...props} />)
}

function UserBalanceChangePage(props: UserBalanceChangePageProps) {
  const common = getBalanceChangeTableProps(props.starkKey)
  return (
    <Page path={common.link} description="TODO: description" user={props.user}>
      <div className="flex max-w-[960px] flex-col gap-y-12">
        <TableWithPagination
          {...common}
          // TODO: override title
          visible={props.balanceChanges.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserBalanceChangeTable
            type={props.type}
            balanceChanges={props.balanceChanges}
          />
        </TableWithPagination>
      </div>
    </Page>
  )
}
