import { PageContext } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { InfoIcon } from '../../assets/icons/InfoIcon'
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
import { TooltipWrapper } from '../../components/Tooltip'
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
  FinalizableOfferEntry,
  UserQuickActionsTable,
  WithdrawableAssetEntry,
} from './components/UserQuickActionsTable'

interface UserPageProps {
  context: PageContext
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
  exchangeAddress: EthereumAddress
  withdrawableAssets: WithdrawableAssetEntry[]
  finalizableOffers: FinalizableOfferEntry[]
  assets: UserAssetEntry[]
  totalAssets: number
  balanceChanges: UserBalanceChangeEntry[]
  totalBalanceChanges: number
  transactions: TransactionEntry[]
  totalTransactions: number
  l2Transactions: PerpetualL2TransactionEntry[]
  totalL2Transactions: number | 'processing'
  offers?: OfferEntry[]
  totalOffers: number
}

export function renderUserPage(props: UserPageProps) {
  return reactToHtml(<UserPage {...props} />)
}

function UserPage(props: UserPageProps) {
  const common = getUserPageProps(props.starkKey)
  const isMine = props.context.user?.starkKey === props.starkKey

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
              ethereumAddress={props.ethereumAddress}
            />
            <UserQuickActionsTable
              withdrawableAssets={props.withdrawableAssets}
              finalizableOffers={props.finalizableOffers}
              isMine={isMine}
              context={props.context}
              exchangeAddress={props.exchangeAddress}
              starkKey={props.starkKey}
            />
          </div>
        </section>
        <Tabs
          items={[
            {
              id: 'assets',
              name: assetsTableTitle,
              accessoryRight: (
                <TooltipWrapper
                  content="Guaranteed state of balances (proven on Ethereum), updated every few
                hours"
                >
                  <InfoIcon />
                </TooltipWrapper>
              ),
              content: (
                <TablePreview
                  {...assetsTablePropsWithoutTitle}
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
              ),
            },
            ...(props.context.showL2Transactions
              ? [
                  {
                    id: 'l2-transactions',
                    name: l2TransactionTableTitle,
                    accessoryRight: (
                      <TooltipWrapper content="Only included transactions are reflected in asset balances">
                        <InfoIcon />
                      </TooltipWrapper>
                    ),
                    shortName: 'L2 Txs',
                    content: (
                      <TablePreview
                        {...l2TransactionsTablePropsWithoutTitle}
                        visible={props.l2Transactions.length}
                        total={props.totalL2Transactions}
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
                  total={props.totalBalanceChanges}
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
              content: (
                <TablePreview
                  {...transactionTablePropsWithoutTitle}
                  visible={props.transactions.length}
                  total={props.totalTransactions}
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
                    content: (
                      <TablePreview
                        {...offerTablePropsWithoutTitle}
                        visible={props.offers.length}
                        total={props.totalOffers}
                      >
                        <OffersTable
                          showStatus
                          showRole
                          offers={props.offers}
                          context={props.context}
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
