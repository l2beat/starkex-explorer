import React from 'react'

import {
  ActionsTable,
  WithdrawableAssetEntry,
} from '../../components/user/ActionsTable'
import { AssetEntry, AssetsTable } from '../../components/user/AssetsTable'
import {
  BalanceChangeEntry,
  BalanceChangesTable,
} from '../../components/user/BalanceChangesTable'
import {
  EthereumTransactionEntry,
  EthereumTransactionsTable,
} from '../../components/user/EthereumTransactionsTable'
import { OfferEntry, OffersTable } from '../../components/user/OffersTable'
import { UserProfile } from '../../components/user/UserProfile'
// eslint-disable-next-line no-restricted-imports
import { AccountDetails } from '../../old/common/AccountDetails'
// eslint-disable-next-line no-restricted-imports
import { Page } from '../../old/common/page/Page'
import { reactToHtml } from '../../reactToHtml'

export interface UserPageProps {
  readonly account: AccountDetails | undefined
  readonly withdrawableAssets: readonly WithdrawableAssetEntry[] // Does ths make sense?
  readonly offersToAccept: readonly OfferEntry[] // We could also pass a simpler object here
  readonly assets: readonly AssetEntry[]
  readonly totalAssets: bigint
  readonly balanceChanges: readonly BalanceChangeEntry[]
  readonly totalBalanceChanges: bigint
  readonly ethereumTransactions: readonly EthereumTransactionEntry[]
  readonly totalEthereumTransactions: bigint
  readonly offers: readonly OfferEntry[]
  readonly totalOffers: bigint
}

export function renderUserPage(props: UserPageProps) {
  return reactToHtml(<UserPage {...props} />)
}

function UserPage(props: UserPageProps) {
  return (
    // TODO: Stop using old page
    <Page path="/newUser" description="User page" account={props.account}>
      <UserProfile ethereumAddress={props.account?.address} />
      <ActionsTable
        withdrawableAssets={props.withdrawableAssets}
        offersToAccept={props.offersToAccept}
      />
      <AssetsTable assets={props.assets} />
      <BalanceChangesTable balanceChanges={props.balanceChanges} />
      <EthereumTransactionsTable
        ethereumTransactions={props.ethereumTransactions}
      />
      <OffersTable offers={props.offers} />
    </Page>
  )
}
