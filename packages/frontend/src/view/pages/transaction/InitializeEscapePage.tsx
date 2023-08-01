import { assertUnreachable, PageContext } from '@explorer/shared'
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

interface InitializeEscapePageProps {
  context: PageContext
  transactionHash: Hash256
  recipient: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress | undefined
  }
  dataFromL1?: {
    asset: Asset
    amount: bigint
  }
  positionOrVaultId: string
  history: {
    timestamp: Timestamp | undefined
    status: 'SENT' | 'MINED'
  }[]
  stateUpdateId?: number
}

export function renderInitializeEscapePage(props: InitializeEscapePageProps) {
  return reactToHtml(<InitializeEscapePage {...props} />)
}

function InitializeEscapePage(props: InitializeEscapePageProps) {
  const historyEntries = props.history.map((entry) => toHistoryEntry(entry))
  const lastEntry = historyEntries[0]
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  return (
    <Page
      context={props.context}
      path={`/transactions/${props.transactionHash.toString()}`}
      description={`Details of the ${props.transactionHash.toString()} forced withdrawal transaction`}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <TransactionPageTitle
            title="Initialize escape"
            transactionHash={props.transactionHash}
          />
          <TransactionOverview
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            value={
              props.dataFromL1
                ? {
                    asset: props.dataFromL1.asset,
                    amount: props.dataFromL1.amount,
                  }
                : undefined
            }
            stateUpdateId={props.stateUpdateId}
          />
        </div>
        <TransactionUserDetails
          title="Recipient details"
          tradingMode="perpetual"
          starkKey={props.recipient.starkKey}
          ethereumAddress={props.recipient.ethereumAddress}
          vaultOrPositionId={props.positionOrVaultId}
        />
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: InitializeEscapePageProps['history'][number]
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (1/2)',
        statusType: 'BEGIN',
        description: 'Initialize escape sent, waiting for it to be mined',
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (2/2)',
        statusType: 'MIDDLE',
        description:
          'Initialize escape mined, you can finalize the escape now on your user page',
      }
    default:
      assertUnreachable(entry.status)
  }
}
