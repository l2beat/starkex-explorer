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
import { TransactionPageTitle } from './components/TransactionPageTitle'

export interface RegularWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
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
        </div>
        {/* TODO: content */}
        <TransactionHistoryTable entries={props.history.map(toHistoryEntry)} />
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
        description: 'Transaction sent.',
      }
    case 'MINED (2/2)':
      return {
        ...base,
        statusType: 'END',
        description: 'Transaction mined.',
      }
    case 'REVERTED':
      return {
        ...base,
        statusType: 'ERROR',
        description: 'Transaction reverted.',
      }
  }
}
