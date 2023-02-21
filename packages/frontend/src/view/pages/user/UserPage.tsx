import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { TablePreview } from '../../components/table/TablePreview'
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
import { UserOfferEntry, UserOffersTable } from './components/UserOffersTable'
import { UserProfile } from './components/UserProfile'
import {
  UserQuickActionsTable,
  WithdrawableAssetEntry,
} from './components/UserQuickActionsTable'
import {
  UserTransactionEntry,
  UserTransactionsTable,
} from './components/UserTransactionsTable'

export interface UserPageProps {
  user: UserDetails | undefined
  starkKey: StarkKey
  ethereumAddress?: EthereumAddress
  type: 'SPOT' | 'PERPETUAL'
  withdrawableAssets: WithdrawableAssetEntry[] // Does ths make sense?
  offersToAccept: UserOfferEntry[] // We could also pass a simpler object here
  assets: UserAssetEntry[]
  totalAssets: number
  balanceChanges: UserBalanceChangeEntry[]
  totalBalanceChanges: number
  transactions: UserTransactionEntry[]
  totalTransactions: number
  offers: UserOfferEntry[]
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
        <UserProfile
          starkKey={props.starkKey}
          ethereumAddress={props.ethereumAddress}
          isMine={isMine}
        />
        <UserQuickActionsTable
          withdrawableAssets={props.withdrawableAssets}
          offersToAccept={props.offersToAccept}
          isMine={isMine}
        />
        <TablePreview
          {...getAssetsTableProps(props.starkKey)}
          visible={props.assets.length}
          total={props.totalAssets}
        >
          <UserAssetsTable
            type={props.type}
            starkKey={props.starkKey}
            assets={props.assets}
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
          <UserTransactionsTable transactions={props.transactions} />
        </TablePreview>
        <TablePreview
          {...getOfferTableProps(props.starkKey)}
          visible={props.offers.length}
          total={props.totalOffers}
        >
          <UserOffersTable offers={props.offers} />
        </TablePreview>
      </ContentWrapper>
    </Page>
  )
}
