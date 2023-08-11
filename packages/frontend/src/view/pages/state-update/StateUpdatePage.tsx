import { PageContext } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TablePreview } from '../../components/table/TablePreview'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { PriceEntry, PricesTable } from '../../components/tables/PricesTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { Tabs } from '../../components/Tabs'
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
  priceChanges?: PriceEntry[]
  transactions: TransactionEntry[]
  l2Transactions: PerpetualL2TransactionEntry[]
}

export function renderStateUpdatePage(props: StateUpdatePageProps) {
  return reactToHtml(<StateUpdatePage {...props} />)
}

function StateUpdatePage(props: StateUpdatePageProps) {
  const {
    title: l2TransactionsTableTitle,
    ...l2TransactionsTablePropsWithoutTitle
  } = getL2TransactionTableProps(props.id)
  const {
    title: balanceChangesTableTitle,
    ...balanceChangesTablePropsWithoutTitle
  } = getBalanceChangeTableProps(props.id)
  const { title: transactionTableTitle, ...transactionTablePropsWithoutTitle } =
    getTransactionTableProps(props.id)

  return (
    <Page
      path={`/state-update/${props.id}`}
      description="Show state update details, including balance changes, transactions and prices"
      context={props.context}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <StateUpdateStats {...props} />
        <Tabs
          items={[
            ...(props.context.showL2Transactions
              ? [
                  {
                    id: 'l2-transactions',
                    name: l2TransactionsTableTitle,
                    content: (
                      <TablePreview
                        {...l2TransactionsTablePropsWithoutTitle}
                        visible={props.l2Transactions.length}
                      >
                        <L2TransactionsTable
                          transactions={props.l2Transactions}
                          context={props.context}
                        />
                      </TablePreview>
                    ),
                  },
                ]
              : []),
            {
              id: 'balance-changes',
              name: balanceChangesTableTitle,
              content: (
                <TablePreview
                  {...balanceChangesTablePropsWithoutTitle}
                  visible={props.balanceChanges.length}
                >
                  <StateUpdateBalanceChangesTable
                    tradingMode={props.context.tradingMode}
                    balanceChanges={props.balanceChanges}
                  />
                </TablePreview>
              ),
            },
            {
              id: 'transactions',
              name: transactionTableTitle,
              content: (
                <TablePreview
                  {...transactionTablePropsWithoutTitle}
                  visible={props.transactions.length}
                >
                  <TransactionsTable
                    transactions={props.transactions}
                    hideAge
                  />
                </TablePreview>
              ),
            },
            ...(props.priceChanges
              ? [
                  {
                    id: 'prices',
                    name: 'Prices',
                    content: (
                      <section>
                        <PricesTable prices={props.priceChanges} />
                      </section>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </ContentWrapper>
    </Page>
  )
}
