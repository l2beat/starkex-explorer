import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { TablePreview } from '../../components/table/TablePreview'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import {
  getAssetsTableProps,
  getBalanceChangeTableProps,
  getOfferTableProps,
  getTransactionTableProps,
  getUserPageProps,
} from './common'
import { UserAssetEntry, UserAssetsTable } from './components/UserAssetTable'
import {
  UserBalanceChangeEntry,
  UserBalanceChangesTable,
} from './components/UserBalanceChangesTable'
import { UserProfile } from './components/UserProfile'
import {
  UserQuickActionsTable,
  WithdrawableAssetEntry,
} from './components/UserQuickActionsTable'

export interface UserPageProps {
  context: PageContext
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
  exchangeAddress: EthereumAddress
  withdrawableAssets: WithdrawableAssetEntry[]
  offersToAccept: OfferEntry[]
  assets: UserAssetEntry[]
  totalAssets: number
  balanceChanges: UserBalanceChangeEntry[]
  totalBalanceChanges: number
  transactions: TransactionEntry[]
  totalTransactions: number
  offers?: OfferEntry[]
  totalOffers: number
}

export function renderUserPage(props: UserPageProps) {
  return reactToHtml(<UserPage {...props} />)
}

function UserPage(props: UserPageProps) {
  const common = getUserPageProps(props.starkKey)
  const isMine = props.context.user?.starkKey === props.starkKey
  return (
    <Page
      path={common.path}
      description={common.description}
      context={props.context}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <section>
          <PageTitle>User</PageTitle>
          <div className="flex flex-col gap-6">
            <UserProfile
              starkKey={props.starkKey}
              ethereumAddress={props.ethereumAddress}
              isMine={isMine}
              exchangeAddress={props.exchangeAddress}
            />
            <UserQuickActionsTable
              withdrawableAssets={props.withdrawableAssets}
              offersToAccept={props.offersToAccept}
              isMine={isMine}
              exchangeAddress={props.exchangeAddress}
              starkKey={props.starkKey}
              user={props.context.user}
            />
          </div>
        </section>
        <TablePreview
          {...getAssetsTableProps(props.starkKey)}
          visible={props.assets.length}
          total={props.totalAssets}
        >
          <UserAssetsTable
            tradingMode={props.context.tradingMode}
            starkKey={props.starkKey}
            assets={props.assets}
            isMine={isMine}
          />
        </TablePreview>
        <TablePreview
          {...getBalanceChangeTableProps(props.starkKey)}
          visible={props.balanceChanges.length}
          total={props.totalBalanceChanges}
        >
          <UserBalanceChangesTable
            tradingMode={props.context.tradingMode}
            balanceChanges={props.balanceChanges}
          />
        </TablePreview>
        <TablePreview
          {...getTransactionTableProps(props.starkKey)}
          visible={props.transactions.length}
          total={props.totalTransactions}
        >
          <TransactionsTable transactions={props.transactions} />
        </TablePreview>
        {props.offers && props.context.tradingMode === 'perpetual' && (
          <TablePreview
            {...getOfferTableProps(props.starkKey)}
            visible={props.offers.length}
            total={props.totalOffers}
          >
            <OffersTable showStatus showRole offers={props.offers} />
          </TablePreview>
        )}
      </ContentWrapper>
    </Page>
  )
}
