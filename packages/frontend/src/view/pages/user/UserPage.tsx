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
  UserAssetTable,
} from '../../components/user/UserAssetTable'
import {
  UserBalanceChangeEntry,
  UserBalanceChangeTable,
} from '../../components/user/UserBalanceChangeTable'
import {
  UserOfferEntry,
  UserOfferTable,
} from '../../components/user/UserOfferTable'
import { UserProfile } from '../../components/user/UserProfile'
import {
  UserTransactionEntry,
  UserTransactionTable,
} from '../../components/user/UserTransactionTable'
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
          <UserAssetTable
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
          <UserBalanceChangeTable
            type={props.type}
            balanceChanges={props.balanceChanges}
          />
        </TablePreview>
        <TablePreview
          {...getTransactionTableProps(props.starkKey)}
          visible={props.transactions.length}
          total={props.totalTransactions}
        >
          <UserTransactionTable transactions={props.transactions} />
        </TablePreview>
        <TablePreview
          {...getOfferTableProps(props.starkKey)}
          visible={props.offers.length}
          total={props.totalOffers}
        >
          <UserOfferTable offers={props.offers} />
        </TablePreview>
      </div>
    </Page>
  )
}
