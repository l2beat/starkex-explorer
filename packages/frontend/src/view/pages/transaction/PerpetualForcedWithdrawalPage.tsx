import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
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

export interface PerpetualForcedWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  recipient: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
  }
  asset: Asset
  amount: bigint
  positionId: string
  history: {
    timestamp: Timestamp
    status: 'SENT (1/3)' | 'MINED (2/3)' | 'REVERTED' | 'INCLUDED (3/3)'
  }[]
}

export function renderPerpetualForcedWithdrawalPage(
  props: PerpetualForcedWithdrawalPageProps
) {
  return reactToHtml(<PerpetualForcedWithdrawalPage {...props} />)
}

function PerpetualForcedWithdrawalPage(
  props: PerpetualForcedWithdrawalPageProps
) {
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
            value={{
              asset: props.asset,
              amount: props.amount,
            }}
          />
        </div>
        <TransactionUserDetails
          title="Recipient details"
          type="PERPETUAL"
          starkKey={props.recipient.starkKey}
          ethereumAddress={props.recipient.ethereumAddress}
          vaultOrPositionId={props.positionId}
        />
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: PerpetualForcedWithdrawalPageProps['history'][number]
): TransactionHistoryEntry {
  const base = {
    timestamp: entry.timestamp,
    statusText: entry.status,
  }
  switch (entry.status) {
    case 'SENT (1/3)':
      return {
        ...base,
        statusType: 'BEGIN',
        description: FORCED_TRANSACTION_SENT,
      }
    case 'MINED (2/3)':
      return {
        ...base,
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_MINED,
      }
    case 'REVERTED':
      return {
        ...base,
        statusType: 'ERROR',
        description: TRANSACTION_REVERTED,
      }
    case 'INCLUDED (3/3)':
      return {
        ...base,
        statusType: 'END',
        description: FORCED_WITHDRAWAL_INCLUDED,
      }
  }
}
