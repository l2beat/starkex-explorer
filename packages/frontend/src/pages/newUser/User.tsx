import React from 'react'

import { Page } from '../common/page/Page'
import { ActionsTable } from './ActionsTable'
import { AssetsTable } from './AssetsTable'
import { BalanceChangesTable } from './BalanceChangesTable'
import { EthereumTransactionsTable } from './EthereumTransactionsTable'
import { OffersTable } from './OffersTable'
import { UserProfile } from './UserProfile'
import { UserProps } from './UserProps'

export function User(props: UserProps) {
  return (
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
