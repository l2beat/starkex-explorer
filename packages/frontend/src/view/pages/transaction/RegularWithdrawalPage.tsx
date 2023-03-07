import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import {
  TransactionHistoryEntry,
  TransactionHistoryTable,
} from './components/HistoryTable'
import { TransactionOverview } from './components/TransactionOverview'
import { TransactionPageTitle } from './components/TransactionPageTitle'
import { TransactionUserDetails } from './components/TransactionUserDetails'

export interface RegularWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  recipient: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
  }
  asset: Asset
  amount?: bigint
  history: {
    timestamp: Timestamp
    status: 'SENT' | 'MINED' | 'REVERTED'
  }[]
  stateUpdateId?: number
}

export function renderRegularWithdrawalPage(props: RegularWithdrawalPageProps) {
  return reactToHtml(<RegularWithdrawalPage {...props} />)
}

function RegularWithdrawalPage(props: RegularWithdrawalPageProps) {
  const historyEntries = props.history.map(toHistoryEntry)
  const lastEntry = historyEntries[0]
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  return (
    <Page
      user={props.user}
      path={`/transactions/${props.transactionHash.toString()}`}
      description="Details of the ${props.transactionHash.toString()} withdrawal transaction"
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <TransactionPageTitle
            title="Withdrawal"
            transactionHash={props.transactionHash}
          />
          <TransactionOverview
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            value={{
              asset: props.asset,
              amount: props.amount,
            }}
            stateUpdateId={props.stateUpdateId}
          />
        </div>
        <TransactionUserDetails
          title="Recipient details"
          starkKey={props.recipient.starkKey}
          ethereumAddress={props.recipient.ethereumAddress}
        />
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: RegularWithdrawalPageProps['history'][number]
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (1/2)',
        statusType: 'BEGIN',
        description: 'Transaction sent',
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (2/2)',
        statusType: 'END',
        description: 'Transaction mined',
      }
    case 'REVERTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'REVERTED',
        statusType: 'ERROR',
        description: 'Transaction reverted',
      }
  }
}
