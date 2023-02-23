import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_INCLUDED,
  FORCED_TRANSACTION_MINED,
  FORCED_TRANSACTION_SENT,
  TRANSACTION_REVERTED,
} from './common'
import {
  TransactionHistoryEntry,
  TransactionHistoryTable,
} from './components/HistoryTable'
import { TransactionPageTitle } from './components/TransactionPageTitle'

export interface PerpetualForcedWithdrawalPageProps {
  user: UserDetails | undefined
  transactionHash: Hash256
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
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
        </div>
        {/* TODO: content */}
        <TransactionHistoryTable entries={props.history.map(toHistoryEntry)} />
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
        description: FORCED_TRANSACTION_INCLUDED,
      }
  }
}
