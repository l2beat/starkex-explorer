import { UserDetails } from '@explorer/shared'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { SectionHeading } from '../../components/SectionHeading'
import { TablePreview } from '../../components/table/TablePreview'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps, getTransactionTableProps } from './common'
import {
  StateUpdateBalanceChangeEntry,
  StateUpdateBalanceChangesTable,
} from './components/StateUpdateBalanceChangesTable'
import {
  StateUpdatePriceEntry,
  StateUpdatePricesTable,
} from './components/StateUpdatePricesTable'
import {
  StateUpdateStats,
  StateUpdateStatsProps,
} from './components/StateUpdateStats'
import {
  StateUpdateTransactionEntry,
  StateUpdateTransactionsTable,
} from './components/StateUpdateTransactionsTable'

export interface StateUpdatePageProps extends StateUpdateStatsProps {
  user: UserDetails | undefined
  type: 'SPOT' | 'PERPETUAL'
  balanceChanges: StateUpdateBalanceChangeEntry[]
  totalBalanceChanges: number
  priceChanges?: StateUpdatePriceEntry[]
  transactions: StateUpdateTransactionEntry[]
  totalTransactions: number
}

export interface StateUpdateTutorialEntry {
  title: string
  imageUrl: string
  href: string
}

export function renderStateUpdatePage(props: StateUpdatePageProps) {
  return reactToHtml(<StateUpdatePage {...props} />)
}

function StateUpdatePage(props: StateUpdatePageProps) {
  return (
    <Page
      path={`/state-update/${props.id}`}
      description="TODO: description"
      user={props.user}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <StateUpdateStats {...props} />
        <TablePreview
          {...getBalanceChangeTableProps(props.id)}
          visible={props.balanceChanges.length}
          total={props.totalBalanceChanges}
        >
          <StateUpdateBalanceChangesTable
            type={props.type}
            balanceChanges={props.balanceChanges}
          />
        </TablePreview>
        {props.priceChanges && (
          <section>
            <SectionHeading title="Price Changes" />
            <StateUpdatePricesTable priceChanges={props.priceChanges} />
          </section>
        )}
        <TablePreview
          {...getTransactionTableProps(props.id)}
          visible={props.transactions.length}
          total={props.totalTransactions}
        >
          <StateUpdateTransactionsTable transactions={props.transactions} />
        </TablePreview>
      </ContentWrapper>
    </Page>
  )
}
