import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
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

export interface OfferAndForcedTradePageProps {
  user: UserDetails | undefined
  offerId: string
  transactionHash?: Hash256
  starkKey: StarkKey
  ethereumAddress: EthereumAddress
  type: 'BUY' | 'SELL'
  // TODO: more
  history: {
    timestamp: Timestamp
    status:
      | 'CREATED (1/5)'
      | 'CANCELLED'
      | 'ACCEPTED (2/5)'
      | 'EXPIRED'
      | 'SENT (3/5)'
      | 'MINED (4/5)'
      | 'REVERTED'
      | 'INCLUDED (5/5)'
  }[]
}

export function renderOfferAndForcedTradePage(
  props: OfferAndForcedTradePageProps
) {
  return reactToHtml(<OfferAndForcedTradePage {...props} />)
}

function OfferAndForcedTradePage(props: OfferAndForcedTradePageProps) {
  return (
    <Page
      user={props.user}
      path={
        props.transactionHash
          ? `/transactions/${props.transactionHash.toString()}`
          : `/offers/${props.offerId}`
      }
      description="TODO: description"
    >
      <ContentWrapper className="flex flex-col gap-12">
        <div>
          {props.transactionHash ? (
            <TransactionPageTitle
              title={`Forced ${props.type.toLowerCase()}`}
              transactionHash={props.transactionHash}
            />
          ) : (
            <PageTitle>Offer #{props.offerId}</PageTitle>
          )}
        </div>
        {/* TODO: content */}
        <TransactionHistoryTable
          entries={props.history.map((x) => toHistoryEntry(x, props.type))}
        />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: OfferAndForcedTradePageProps['history'][number],
  type: 'BUY' | 'SELL'
): TransactionHistoryEntry {
  const counterparty = type === 'BUY' ? 'seller' : 'buyer'
  const base = {
    timestamp: entry.timestamp,
    statusText: entry.status,
  }
  switch (entry.status) {
    case 'CREATED (1/5)':
      return {
        ...base,
        statusType: 'BEGIN',
        description: `Offer created, looking for ${counterparty}s to accept.`,
      }
    case 'CANCELLED':
      return {
        ...base,
        statusType: 'CANCEL',
        description: 'Offer cancelled by creator.',
      }
    case 'ACCEPTED (2/5)':
      return {
        ...base,
        statusType: 'MIDDLE',
        description: `Offer accepted by ${counterparty}, waiting for creator to send.`,
      }
    case 'EXPIRED':
      return {
        ...base,
        statusType: 'CANCEL',
        description: 'Offer expired.',
      }
    case 'SENT (3/5)':
      return {
        ...base,
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_SENT,
      }
    case 'MINED (4/5)':
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
    case 'INCLUDED (5/5)':
      return {
        ...base,
        statusType: 'END',
        description: FORCED_TRANSACTION_INCLUDED,
      }
  }
}
