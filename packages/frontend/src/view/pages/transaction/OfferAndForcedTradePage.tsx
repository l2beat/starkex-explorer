import { UserDetails } from '@explorer/shared'
import { EthereumAddress, Hash256, StarkKey, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../utils/assets'
import { Button } from '../../components/Button'
import { ContentWrapper } from '../../components/page/ContentWrapper'
import { Page } from '../../components/page/Page'
import { PageTitle } from '../../components/PageTitle'
import { reactToHtml } from '../../reactToHtml'
import {
  FORCED_TRANSACTION_MINED,
  FORCED_TRANSACTION_SENT,
  TRANSACTION_REVERTED,
} from './common'
import {
  TransactionHistoryEntry,
  TransactionHistoryTable,
} from './components/HistoryTable'
import { IncludedWithStateUpdateId } from './components/IncludedWithStateUpdateId'
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
  history: {
    timestamp: Timestamp | undefined
    status:
      | 'CREATED'
      | 'CANCELLED'
      | 'ACCEPTED'
      | 'EXPIRED'
      | 'SENT'
      | 'MINED'
      | 'REVERTED'
      | 'INCLUDED'
  }[]
  expirationTimestamp?: Timestamp
  stateUpdateId?: number
}

export function renderOfferAndForcedTradePage(
  props: OfferAndForcedTradePageProps
) {
  return reactToHtml(<OfferAndForcedTradePage {...props} />)
}

function OfferAndForcedTradePage(props: OfferAndForcedTradePageProps) {
  const isMine = props.user?.starkKey === props.maker.starkKey
  const historyEntries = props.history.map((x) =>
    toHistoryEntry(x, props.type, props.stateUpdateId)
  )
  const lastEntry = historyEntries[0]
  const status = props.history[0]?.status
  if (!lastEntry) {
    throw new Error('No history entries')
  }

  const showCancel = isMine && (status === 'CREATED' || status === 'ACCEPTED')
  const showSendTransaction = isMine && status === 'ACCEPTED'
  const showAccept = !isMine && Boolean(props.user) && status === 'CREATED'

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
          <div className="flex items-center justify-between">
            {props.transactionHash ? (
              <TransactionPageTitle
                title={`Forced ${props.type.toLowerCase()}`}
                transactionHash={props.transactionHash}
              />
            ) : (
              <PageTitle>
                Forced {props.type.toLowerCase()} offer #{props.offerId}
              </PageTitle>
            )}
            <div className="mb-6 flex items-center gap-2">
              {showCancel && <Button variant="outlined">Cancel offer</Button>}
              {showSendTransaction && (
                <Button variant="contained">Send transaction</Button>
              )}
              {showAccept && (
                <Button variant="contained">
                  Accept & {props.type === 'BUY' ? 'sell' : 'buy'}
                </Button>
              )}
            </div>
          </div>
          <TransactionOverview
            stateUpdateId={props.stateUpdateId}
            statusText={lastEntry.statusText}
            statusType={lastEntry.statusType}
            statusDescription={lastEntry.description}
            transactionHash={props.transactionHash}
            timestamp={
              !props.transactionHash &&
              status !== 'EXPIRED' &&
              props.expirationTimestamp
                ? {
                    label: 'Expiration timestamp',
                    timestamp: props.expirationTimestamp,
                  }
                : undefined
            }
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
          tradingMode="perpetual"
          starkKey={props.maker.starkKey}
          ethereumAddress={props.maker.ethereumAddress}
          vaultOrPositionId={props.maker.positionId}
        />
        {props.taker && (
          <TransactionUserDetails
            title={`${props.type === 'BUY' ? 'Seller' : 'Buyer'} details`}
            tradingMode="perpetual"
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
  type: 'BUY' | 'SELL',
  stateUpdateId?: number
): TransactionHistoryEntry {
  switch (entry.status) {
    case 'CREATED':
      return {
        timestamp: entry.timestamp,
        statusText: 'CREATED (1/5)',
        statusType: 'BEGIN',
        description: `Offer created, looking for ${
          type === 'BUY' ? 'sellers' : 'buyers'
        } to accept`,
      }
    case 'CANCELLED':
      return {
        timestamp: entry.timestamp,
        statusText: 'CANCELLED',
        statusType: 'CANCEL',
        description: 'Offer cancelled by creator',
      }
    case 'ACCEPTED':
      return {
        timestamp: entry.timestamp,
        statusText: 'ACCEPTED (2/5)',
        statusType: 'MIDDLE',
        description: `${
          type === 'BUY' ? 'Seller' : 'Buyer'
        } found, waiting for creator to send`,
      }
    case 'EXPIRED':
      return {
        timestamp: entry.timestamp,
        statusText: 'EXPIRED',
        statusType: 'CANCEL',
        description: 'Offer expired',
      }
    case 'SENT':
      return {
        timestamp: entry.timestamp,
        statusText: 'SENT (3/5)',
        statusType: 'MIDDLE',
        description: FORCED_TRANSACTION_SENT,
      }
    case 'MINED':
      return {
        timestamp: entry.timestamp,
        statusText: 'MINED (4/5)',
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
        statusText: 'INCLUDED (5/5)',
        statusType: 'END',
        description: (
          <IncludedWithStateUpdateId stateUpdateId={stateUpdateId} />
        ),
      }
  }
}
