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
  amount: bigint
  history: {
    timestamp: Timestamp
    status: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED'
  }[]
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
      description="TODO: description"
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
  const base = {
    timestamp: entry.timestamp,
    statusText: entry.status,
  }
  switch (entry.status) {
    case 'SENT (1/2)':
      return {
        ...base,
        statusType: 'BEGIN',
        description: 'Transaction sent',
      }
    case 'MINED (2/2)':
      return {
        ...base,
        statusType: 'END',
        description: 'Transaction mined',
      }
    case 'REVERTED':
      return {
        ...base,
        statusType: 'ERROR',
        description: 'Transaction reverted',
      }
  }
}
