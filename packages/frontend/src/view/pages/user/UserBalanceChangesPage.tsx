import { TradingMode, UserDetails } from '@explorer/shared'
import { StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps } from './common'
import {
  UserBalanceChangeEntry,
  UserBalanceChangesTable,
} from './components/UserBalanceChangesTable'
import { UserPageTitle } from './components/UserPageTitle'

export interface UserBalanceChangesPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  tradingMode: TradingMode
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
    <Page path={common.path} description={common.description} user={props.user}>
      <ContentWrapper>
        <TableWithPagination
          {...common}
          title={
            <UserPageTitle
              prefix="Balance changes of"
              starkKey={props.starkKey}
            />
          }
          visible={props.balanceChanges.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <UserBalanceChangesTable
            tradingMode={props.tradingMode}
            balanceChanges={props.balanceChanges}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
