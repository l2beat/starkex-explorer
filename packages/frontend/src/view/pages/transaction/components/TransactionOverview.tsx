import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../../utils/assets'
import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import { AssetWithAmountCard } from '../../../components/AssetWithAmountCard'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { TransactionField } from './TransactionField'

interface TransactionOverviewProps {
  statusType: StatusType
  statusText: string
  statusDescription: React.ReactNode
  transactionHash?: Hash256
  timestamp?: {
    label: string
    timestamp: Timestamp
  }
  value?: {
    asset: Asset
    amount?: bigint
  }
  trade?: {
    offeredAsset: Asset
    offeredAmount: bigint
    receivedAsset: Asset
    receivedAmount: bigint
  }
  stateUpdateId?: number
}

export function TransactionOverview(props: TransactionOverviewProps) {
  const delayDays = Math.ceil(
    (Number(props.timestamp?.timestamp) - Date.now()) / (24 * 60 * 60 * 1000)
  )
  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-800 p-6">
      <div className="flex">
        <TransactionField label="Current status">
          <div className="flex items-center gap-2">
            <StatusBadge type={props.statusType}>
              {props.statusText}
            </StatusBadge>
            <p>{props.statusDescription}</p>
          </div>
        </TransactionField>
        {props.timestamp && (
          <TransactionField
            label={props.timestamp.label}
            className="text-right"
          >
            {formatTimestamp(props.timestamp.timestamp)} UTC{' '}
            <span className="text-zinc-500">
              ({delayDays} {delayDays === 1 ? 'day' : 'days'})
            </span>
          </TransactionField>
        )}
      </div>
      {props.transactionHash && (
        <TransactionField label="Transaction hash">
          <EtherscanLink txHash={props.transactionHash.toString()} type="tx">
            {props.transactionHash.toString()}
          </EtherscanLink>
        </TransactionField>
      )}
      {props.value && (
        <AssetWithAmountCard
          className="w-1/2"
          amount={props.value.amount}
          asset={props.value.asset}
        />
      )}
      {props.trade && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <AssetWithAmountCard
            amountLabel="Offered amount"
            amount={props.trade.offeredAmount}
            assetLabel="Offered asset"
            asset={props.trade.offeredAsset}
          />
          <ArrowRightIcon className="rounded bg-slate-800 text-zinc-500" />
          <AssetWithAmountCard
            amountLabel="Received amount"
            amount={props.trade.receivedAmount}
            assetLabel="Received asset"
            asset={props.trade.receivedAsset}
          />
        </div>
      )}
    </div>
  )
}
