import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TableWithPagination } from '../../components/table/TableWithPagination'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { PerpetualL2TransactionEntry } from '../l2-transaction/common'
import { getL2TransactionTableProps } from './common'
import { StateUpdatePageTitle } from './components/StateUpdatePageTitle'

export interface StateUpdateL2TransactionsPageProps {
  context: PageContext
  id: string
  l2Transactions: PerpetualL2TransactionEntry[]
  limit: number
  offset: number
  total: number
}

export function renderStateUpdateL2TransactionsPage(
  props: StateUpdateL2TransactionsPageProps
) {
  return reactToHtml(<StateUpdateL2TransactionsPage {...props} />)
}

function StateUpdateL2TransactionsPage(
  props: StateUpdateL2TransactionsPageProps
) {
  const common = getL2TransactionTableProps(props.id)
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
              prefix="L2 transactions of state update"
              id={props.id}
            />
          }
          visible={props.l2Transactions.length}
          limit={props.limit}
          offset={props.offset}
          total={props.total}
        >
          <L2TransactionsTable
            transactions={props.l2Transactions}
            context={props.context}
          />
        </TableWithPagination>
      </ContentWrapper>
    </Page>
  )
}
