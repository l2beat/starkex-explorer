import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_MINED,
  FORCED_TRANSACTION_SENT,
  FORCED_WITHDRAWAL_INCLUDED,
  TRANSACTION_REVERTED,
} from './common'
import {
  TransactionHistoryEntry,
  TransactionHistoryTable,
} from './components/HistoryTable'
import { TransactionOverview } from './components/TransactionOverview'
import { TransactionPageTitle } from './components/TransactionPageTitle'
import { TransactionUserDetails } from './components/TransactionUserDetails'

export interface SpotForcedWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  recipient: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
  }
  vaultId: string
  history: {
    timestamp: Timestamp
    status: 'SENT' | 'MINED' | 'REVERTED' | 'INCLUDED'
  }[]
  stateUpdateId?: number
}

export function renderSpotForcedWithdrawalPage(
  props: SpotForcedWithdrawalPageProps
) {
  return reactToHtml(<SpotForcedWithdrawalPage {...props} />)
}

function SpotForcedWithdrawalPage(props: SpotForcedWithdrawalPageProps) {
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
            title="Forced withdrawal"
            transactionHash={props.transactionHash}
          />
          <TransactionOverview
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            stateUpdateId={props.stateUpdateId}
          />
        </div>
        <TransactionUserDetails
          title="Recipient details"
          type="SPOT"
          starkKey={props.recipient.starkKey}
          ethereumAddress={props.recipient.ethereumAddress}
          vaultOrPositionId={props.vaultId}
        />
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: SpotForcedWithdrawalPageProps['history'][number]
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (1/3)',
        statusType: 'BEGIN',
        description: FORCED_TRANSACTION_SENT,
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (2/3)',
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_MINED,
      }
    case 'REVERTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'REVERTED',
        statusType: 'ERROR',
        description: TRANSACTION_REVERTED,
      }
    case 'INCLUDED':
      return {
        timestamp: entry.timestamp,
        statusText: 'INCLUDED (3/3)',
        statusType: 'END',
        description: FORCED_WITHDRAWAL_INCLUDED,
      }
  }
}
