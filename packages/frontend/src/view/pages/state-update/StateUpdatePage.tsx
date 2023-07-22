import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { SectionHeading } from '../../components/SectionHeading'
import { TablePreview } from '../../components/table/TablePreview'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { PriceEntry, PricesTable } from '../../components/tables/PricesTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import { PerpetualL2TransactionEntry } from '../l2-transaction/common'
import {
  getBalanceChangeTableProps,
  getL2TransactionTableProps,
  getTransactionTableProps,
} from './common'
import {
  StateUpdateBalanceChangeEntry,
  StateUpdateBalanceChangesTable,
} from './components/StateUpdateBalanceChangesTable'
import {
  StateUpdateStats,
  StateUpdateStatsProps,
} from './components/StateUpdateStats'

interface StateUpdatePageProps extends StateUpdateStatsProps {
  context: PageContext
  balanceChanges: StateUpdateBalanceChangeEntry[]
  totalBalanceChanges: number
  priceChanges?: PriceEntry[]
  transactions: TransactionEntry[]
  l2Transactions: PerpetualL2TransactionEntry[]
  totalL2Transactions: number | 'processing'
  totalTransactions: number
}

export function renderStateUpdatePage(props: StateUpdatePageProps) {
  return reactToHtml(<StateUpdatePage {...props} />)
}

function StateUpdatePage(props: StateUpdatePageProps) {
  return (
    <Page
      path={`/state-update/${props.id}`}
      description="Show state update details, including balance changes, transactions and prices"
      context={props.context}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <StateUpdateStats {...props} />
        {props.context.showL2Transactions && (
          <TablePreview
            {...getL2TransactionTableProps(props.id)}
            visible={props.l2Transactions.length}
            total={props.totalL2Transactions}
          >
            <L2TransactionsTable
              transactions={props.l2Transactions}
              context={props.context}
            />
          </TablePreview>
        )}
        <TablePreview
          {...getBalanceChangeTableProps(props.id)}
          visible={props.balanceChanges.length}
          total={props.totalBalanceChanges}
        >
          <StateUpdateBalanceChangesTable
            tradingMode={props.context.tradingMode}
            balanceChanges={props.balanceChanges}
          />
        </TablePreview>
        <TablePreview
          {...getTransactionTableProps(props.id)}
          visible={props.transactions.length}
          total={props.totalTransactions}
        >
          <TransactionsTable hideTime transactions={props.transactions} />
        </TablePreview>
        {props.priceChanges && (
          <section>
            <SectionHeading title="Prices at state update" />
            <PricesTable prices={props.priceChanges} />
          </section>
        )}
      </ContentWrapper>
    </Page>
  )
}
