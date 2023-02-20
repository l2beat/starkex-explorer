import { UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { reactToHtml } from '../../reactToHtml'
import { getTransactionTableProps } from './common'
import { StateUpdatePageTitle } from './components/StateUpdatePageTitle'
import {
  StateUpdateTransactionEntry,
  StateUpdateTransactionsTable,
} from './components/StateUpdateTransactionsTable'

export interface StateUpdateTransactionsPageProps {
  user: UserDetails | undefined
  id: string
  transactions: StateUpdateTransactionEntry[]
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
    <Page path={common.link} description="TODO: description" user={props.user}>
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
          <StateUpdateTransactionsTable transactions={props.transactions} />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
