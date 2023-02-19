import { UserDetails } from '@explorer/shared'
import { PedersenHash, Timestamp } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TablePreview } from '../../components/table/TablePreview'
import { reactToHtml } from '../../reactToHtml'
import { getBalanceChangeTableProps, getTransactionTableProps } from './common'
import {
  StateUpdateBalanceChangeEntry,
  StateUpdateBalanceChangesTable,
} from './components/StateUpdateBalanceChangesTable'
import {
  StateUpdateTransactionEntry,
  StateUpdateTransactionsTable,
} from './components/StateUpdateTransactionsTable'

export interface StateUpdatePageProps {
  user: UserDetails | undefined
  id: string
  type: 'SPOT' | 'PERPETUAL'
  stats: {
    hashes: {
      factHash: PedersenHash
      positionTreeRoot?: PedersenHash
      onChainVaultTreeRoot?: PedersenHash
      offChainVaultTreeRoot?: PedersenHash
      orderRoot: PedersenHash
    }
    blockNumber: number
    ethereumTimestamp: Timestamp
    starkExTimestamp: Timestamp
  }
  balanceChanges: StateUpdateBalanceChangeEntry[]
  totalBalanceChanges: number
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
        <div>
          <h1 className="mb-4 text-xxl font-bold">State Update #{props.id}</h1>
          <div>{props.stats.hashes.factHash.toString()}</div>
          <div>{props.stats.hashes.positionTreeRoot?.toString()}</div>
          <div>{props.stats.hashes.onChainVaultTreeRoot?.toString()}</div>
          <div>{props.stats.hashes.offChainVaultTreeRoot?.toString()}</div>
          <div>{props.stats.hashes.orderRoot.toString()}</div>
          <div>{props.stats.blockNumber}</div>
          <div>{props.stats.ethereumTimestamp.toString()}</div>
          <div>{props.stats.starkExTimestamp.toString()}</div>
        </div>
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
