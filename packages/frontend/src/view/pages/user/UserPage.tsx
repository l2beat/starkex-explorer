import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { CountBadge } from '../../components/CountBadge'
import { InfoBanner } from '../../components/InfoBanner'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { TablePreview } from '../../components/table/TablePreview'
import { L2TransactionsTable } from '../../components/tables/l2-transactions/L2TransactionsTable'
import { OfferEntry, OffersTable } from '../../components/tables/OffersTable'
import {
  TransactionEntry,
  TransactionsTable,
} from '../../components/tables/TransactionsTable'
import { Tabs } from '../../components/Tabs'
import { reactToHtml } from '../../reactToHtml'
import { PerpetualL2TransactionEntry } from '../l2-transaction/common'
import {
  getAssetsTableProps,
  getBalanceChangeTableProps,
  getL2TransactionTableProps,
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
  EscapableAssetEntry,
  FinalizableOfferEntry,
  UserQuickActionsTable,
  WithdrawableAssetEntry,
} from './components/UserQuickActionsTable'

interface UserPageProps {
  context: PageContext
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
  exchangeAddress: EthereumAddress
  escapableAssets: EscapableAssetEntry[]
  withdrawableAssets: WithdrawableAssetEntry[]
  finalizableOffers: FinalizableOfferEntry[]
  assets: UserAssetEntry[]
  totalAssets: number
  balanceChanges: UserBalanceChangeEntry[]
  totalBalanceChanges: number
  transactions: TransactionEntry[]
  totalTransactions: number
  l2Transactions: PerpetualL2TransactionEntry[]
  totalL2Transactions: number
  offers?: OfferEntry[]
  totalOffers: number
  showAsMine?: boolean
}

export function renderUserPage(props: UserPageProps) {
  return reactToHtml(<UserPage {...props} />)
}

function UserPage(props: UserPageProps) {
  const common = getUserPageProps(props.starkKey)
  const isMine =
    props.showAsMine ?? props.context.user?.starkKey === props.starkKey

  const { title: assetsTableTitle, ...assetsTablePropsWithoutTitle } =
    getAssetsTableProps(props.starkKey)
  const {
    title: l2TransactionTableTitle,
    ...l2TransactionsTablePropsWithoutTitle
  } = getL2TransactionTableProps(props.starkKey)
  const {
    title: balanceChangesTableTitle,
    ...balanceChangesTablePropsWithoutTitle
  } = getBalanceChangeTableProps(props.starkKey)
  const { title: transactionTableTitle, ...transactionTablePropsWithoutTitle } =
    getTransactionTableProps(props.starkKey)
  const { title: offerTableTitle, ...offerTablePropsWithoutTitle } =
    getOfferTableProps(props.starkKey)

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
              user={props.context.user}
              starkKey={props.starkKey}
              chainId={props.context.chainId}
              ethereumAddress={props.ethereumAddress}
            />
            {isMine && (
              <UserQuickActionsTable
                escapableAssets={props.escapableAssets}
                withdrawableAssets={props.withdrawableAssets}
                finalizableOffers={props.finalizableOffers}
                context={props.context}
                exchangeAddress={props.exchangeAddress}
                starkKey={props.starkKey}
              />
            )}
          </div>
        </section>
        <Tabs
          items={[
            {
              id: 'assets',
              name: assetsTableTitle,
              accessoryRight: <CountBadge count={props.totalAssets} />,
              content: (
                <>
                  <InfoBanner className="mb-3">
                    Guaranteed state of balance (proven on Ethereum), updated
                    every few hours
                  </InfoBanner>
                  <TablePreview
                    viewAllPosition="bottom"
                    visible={props.assets.length}
                    {...assetsTablePropsWithoutTitle}
                  >
                    <UserAssetsTable
                      tradingMode={props.context.tradingMode}
                      ethereumAddress={props.ethereumAddress}
                      starkKey={props.starkKey}
                      assets={props.assets}
                      isMine={isMine}
                      isFrozen={props.context.freezeStatus === 'frozen'}
                    />
                  </TablePreview>
                </>
              ),
            },
            ...(props.context.showL2Transactions
              ? [
                  {
                    id: 'l2-transactions',
                    name: l2TransactionTableTitle,
                    accessoryRight: (
                      <CountBadge count={props.totalL2Transactions} />
                    ),
                    content: (
                      <>
                        <InfoBanner className="mb-3">
                          Only included transactions are reflected in asset
                          balances
                        </InfoBanner>
                        <TablePreview
                          viewAllPosition="bottom"
                          visible={props.l2Transactions.length}
                          {...l2TransactionsTablePropsWithoutTitle}
                        >
                          <L2TransactionsTable
                            transactions={props.l2Transactions}
                            context={props.context}
                          />
                        </TablePreview>
                      </>
                    ),
                  },
                ]
              : []),
            {
              id: 'balance-changes',
              name: balanceChangesTableTitle,
              accessoryRight: <CountBadge count={props.totalBalanceChanges} />,
              content: (
                <TablePreview
                  viewAllPosition="bottom"
                  visible={props.balanceChanges.length}
                  {...balanceChangesTablePropsWithoutTitle}
                >
                  <UserBalanceChangesTable
                    tradingMode={props.context.tradingMode}
                    balanceChanges={props.balanceChanges}
                  />
                </TablePreview>
              ),
            },
            {
              id: 'transactions',
              name: transactionTableTitle,
              accessoryRight: <CountBadge count={props.totalTransactions} />,
              content: (
                <TablePreview
                  viewAllPosition="bottom"
                  visible={props.transactions.length}
                  {...transactionTablePropsWithoutTitle}
                >
                  <TransactionsTable transactions={props.transactions} />
                </TablePreview>
              ),
            },
            ...(props.offers && props.context.tradingMode === 'perpetual'
              ? [
                  {
                    id: 'offers',
                    name: offerTableTitle,
                    accessoryRight: <CountBadge count={props.totalOffers} />,
                    content: (
                      <TablePreview
                        viewAllPosition="bottom"
                        visible={props.offers.length}
                        {...offerTablePropsWithoutTitle}
                      >
                        <OffersTable
                          offers={props.offers}
                          context={props.context}
                          showTypeColumn
                          showRole
                        />
                      </TablePreview>
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
