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

interface FinalizeEscapeDetailsPageProps {
  context: PageContext
  transactionHash: Hash256
  recipient: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress | undefined
  }
  asset: Asset
  amount: bigint
  positionOrVaultId?: string
  history: {
    timestamp: Timestamp | undefined
    status: 'SENT' | 'MINED' | 'REVERTED'
  }[]
}

export function renderFinalizeEscapeDetailsPage(
  props: FinalizeEscapeDetailsPageProps
) {
  return reactToHtml(<FinalizeEscapeDetailsPage {...props} />)
}

function FinalizeEscapeDetailsPage(props: FinalizeEscapeDetailsPageProps) {
  const historyEntries = props.history.map((entry) => toHistoryEntry(entry))
  const lastEntry = historyEntries[0]
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  return (
    <Page
      context={props.context}
      path={`/transactions/${props.transactionHash.toString()}`}
      description={`Details of the ${props.transactionHash.toString()} finalize escape transaction`}
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          <TransactionPageTitle
            title="Finalize escape"
            transactionHash={props.transactionHash}
          />
          <TransactionOverview
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            value={{ asset: props.asset, amount: props.amount }}
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
  entry: FinalizeEscapeDetailsPageProps['history'][number]
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (1/2)',
        statusType: 'BEGIN',
        description: 'Finalize escape sent, waiting for it to be mined',
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (2/2)',
        statusType: 'MIDDLE',
        description:
          'Finalize escape mined, you can withdraw all your money on your user page',
      }
    case 'REVERTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'REVERTED',
        statusType: 'ERROR',
        description: 'Finalize escape reverted',
      }
    default:
      assertUnreachable(entry.status)
  }
}
