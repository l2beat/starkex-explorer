import { UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps } from './common'
import {
  UserBalanceChangeEntry,
  UserBalanceChangesTable,
} from './components/UserBalanceChangesTable'

export interface UserBalanceChangesPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  type: 'SPOT' | 'PERPETUAL'
  balanceChanges: UserBalanceChangeEntry[]
  limit: number
  offset: number
  total: number
}

export function renderUserBalanceChangesPage(
  props: UserBalanceChangesPageProps
) {
  return reactToHtml(<UserBalanceChangesPage {...props} />)
}

function UserBalanceChangesPage(props: UserBalanceChangesPageProps) {
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
          <UserBalanceChangesTable
            type={props.type}
            balanceChanges={props.balanceChanges}
          />
        </TableWithPagination>
      </div>
    </Page>
  )
}
