import { PageContext } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

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

interface FreezeRequestDetailsPageProps {
  context: PageContext
  transactionHash: Hash256
  ignored: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress | undefined
  }
  history: {
    timestamp: Timestamp | undefined
    status: 'SENT' | 'MINED' | 'REVERTED'
  }[]
}

export function renderFreezeRequestDetailsPage(
  props: FreezeRequestDetailsPageProps
) {
  return reactToHtml(<FreezeRequestDetailsPage {...props} />)
}

function FreezeRequestDetailsPage(props: FreezeRequestDetailsPageProps) {
  const historyEntries = props.history.map((entry) => toHistoryEntry(entry))
  const lastEntry = historyEntries[0]
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  return (
    <Page
      context={props.context}
      path={`/transactions/${props.transactionHash.toString()}`}
      description={`Details of the ${props.transactionHash.toString()} freeze request transaction`}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <TransactionPageTitle
            title="Freeze request"
            transactionHash={props.transactionHash}
          />
          <TransactionOverview
            chainId={props.context.chainId}
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
          />
        </div>
        <TransactionUserDetails
          chainId={props.context.chainId}
          title="Ignored user details"
          tradingMode="perpetual"
          starkKey={props.ignored.starkKey}
          ethereumAddress={props.ignored.ethereumAddress}
        />
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: FreezeRequestDetailsPageProps['history'][number]
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (1/2)',
        statusType: 'BEGIN',
        description: 'Freeze request sent',
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (2/2)',
        statusType: 'MIDDLE',
        description: 'Freeze request mined, the exchange is now frozen',
      }
    case 'REVERTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'REVERTED',
        statusType: 'ERROR',
        description: 'Freeze request reverted',
      }
  }
}
