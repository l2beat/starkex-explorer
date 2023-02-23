import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
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
import { TransactionOverview } from './components/TransactionOverview'
import { TransactionPageTitle } from './components/TransactionPageTitle'
import { TransactionUserDetails } from './components/TransactionUserDetails'

export interface OfferAndForcedTradePageProps {
  user: UserDetails | undefined
  offerId: string
  transactionHash?: Hash256
  maker: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
    positionId: string
  }
  taker?: {
    starkKey: StarkKey
    ethereumAddress: EthereumAddress
    positionId: string
  }
  type: 'BUY' | 'SELL'
  collateralAsset: Asset
  collateralAmount: bigint
  syntheticAsset: Asset
  syntheticAmount: bigint
  expirationTimestamp: Timestamp
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
  const historyEntries = props.history.map((x) => toHistoryEntry(x, props.type))
  const lastEntry = historyEntries[0]
  if (!lastEntry) {
    throw new Error('No history entries')
  }

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
          <TransactionOverview
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            trade={
              props.type === 'SELL'
                ? {
                    offeredAmount: props.syntheticAmount,
                    offeredAsset: props.syntheticAsset,
                    receivedAmount: props.collateralAmount,
                    receivedAsset: props.collateralAsset,
                  }
                : {
                    offeredAmount: props.collateralAmount,
                    offeredAsset: props.collateralAsset,
                    receivedAmount: props.syntheticAmount,
                    receivedAsset: props.syntheticAsset,
                  }
            }
          />
        </div>
        <TransactionUserDetails
          title="Offer creator details"
          type="PERPETUAL"
          starkKey={props.maker.starkKey}
          ethereumAddress={props.maker.ethereumAddress}
          vaultOrPositionId={props.maker.positionId}
        />
        {props.taker && (
          <TransactionUserDetails
            title={`${props.type === 'BUY' ? 'Seller' : 'Buyer'} details`}
            type="PERPETUAL"
            starkKey={props.taker.starkKey}
            ethereumAddress={props.taker.ethereumAddress}
            vaultOrPositionId={props.taker.positionId}
          />
        )}
        <TransactionHistoryTable entries={historyEntries} />
      </ContentWrapper>
    </Page>
  )
}

function toHistoryEntry(
  entry: OfferAndForcedTradePageProps['history'][number],
  type: 'BUY' | 'SELL'
): TransactionHistoryEntry {
  const base = {
    timestamp: entry.timestamp,
    statusText: entry.status,
  }
  switch (entry.status) {
    case 'CREATED (1/5)':
      return {
        ...base,
        statusType: 'BEGIN',
        description: `Offer created, looking for ${
          type === 'BUY' ? 'sellers' : 'buyers'
        } to accept`,
      }
    case 'CANCELLED':
      return {
        ...base,
        statusType: 'CANCEL',
        description: 'Offer cancelled by creator',
      }
    case 'ACCEPTED (2/5)':
      return {
        ...base,
        statusType: 'MIDDLE',
        description: `${
          type === 'BUY' ? 'Seller' : 'Buyer'
        } found, waiting for creator to send`,
      }
    case 'EXPIRED':
      return {
        ...base,
        statusType: 'CANCEL',
        description: 'Offer expired',
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
