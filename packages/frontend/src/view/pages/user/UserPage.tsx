import { UserDetails } from '@explorer/shared'
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
  user: UserDetails | undefined
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
  type: 'SPOT' | 'PERPETUAL'
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
  const isMine = props.user?.starkKey === props.starkKey
  return (
    <Page
      path={`/users/${props.starkKey.toString()}`}
      description="TODO: description"
      user={props.user}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <section>
          <PageTitle>User</PageTitle>
          <div className="flex flex-col gap-6">
            <UserProfile
              starkKey={props.starkKey}
              ethereumAddress={
                props.ethereumAddress !== EthereumAddress.ZERO
                  ? props.ethereumAddress
                  : undefined
              }
              isMine={isMine}
            />
            <UserQuickActionsTable
              withdrawableAssets={props.withdrawableAssets}
              offersToAccept={props.offersToAccept}
              isMine={isMine}
            />
          </div>
        </section>
        <TablePreview
          {...getAssetsTableProps(props.starkKey)}
          visible={props.assets.length}
          total={props.totalAssets}
        >
          <UserAssetsTable
            type={props.type}
            starkKey={props.starkKey}
            assets={props.assets}
            isMine={props.user !== undefined}
          />
        </TablePreview>
        <TablePreview
          {...getBalanceChangeTableProps(props.starkKey)}
          visible={props.balanceChanges.length}
          total={props.totalBalanceChanges}
        >
          <UserBalanceChangesTable
            type={props.type}
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
        {props.offers && (
          <TablePreview
            {...getOfferTableProps(props.starkKey)}
            visible={props.offers.length}
            total={props.totalOffers}
          >
            <OffersTable offers={props.offers} />
          </TablePreview>
        )}
      </ContentWrapper>
    </Page>
  )
}
