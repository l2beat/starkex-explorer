import { UserDetails } from '@explorer/shared'
import { EthereumAddress, StarkKey } from '@explorer/types'
import React from 'react'

import { Page } from '../../components/common/page/Page'
import { TablePreview } from '../../components/common/table/TablePreview'
import {
  ActionsTable,
  WithdrawableAssetEntry,
} from '../../components/user/ActionsTable'
import {
  UserAssetEntry,
  UserAssetsTable,
} from '../../components/user/UserAssetTable'
import {
  UserBalanceChangeEntry,
  UserBalanceChangesTable,
} from '../../components/user/UserBalanceChangesTable'
import {
  UserOfferEntry,
  UserOffersTable,
} from '../../components/user/UserOffersTable'
import { UserProfile } from '../../components/user/UserProfile'
import {
  UserTransactionEntry,
  UserTransactionsTable,
} from '../../components/user/UserTransactionsTable'
import { reactToHtml } from '../../reactToHtml'
import {
  getAssetsTableProps,
  getBalanceChangeTableProps,
  getOfferTableProps,
  getTransactionTableProps,
} from './common'

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
  return (
    <Page
      path={`/user/${props.starkKey.toString()}`}
      description="TODO: description"
      user={props.user}
    >
      <div className="flex max-w-[960] flex-col gap-y-12">
        <UserProfile
          starkKey={props.starkKey}
          ethereumAddress={props.ethereumAddress}
        />
        <ActionsTable
          withdrawableAssets={props.withdrawableAssets}
          offersToAccept={props.offersToAccept}
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
      </div>
    </Page>
  )
}
