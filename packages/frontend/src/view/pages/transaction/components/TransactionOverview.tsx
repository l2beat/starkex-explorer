import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../../utils/assets'
import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { ArrowDownIcon, ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import { AssetAmountCard } from '../../../components/AssetAmountCard'
import { EtherscanLink } from '../../../components/EtherscanLink'
import { InlineEllipsis } from '../../../components/InlineEllipsis'
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
  chainId: number
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
          <EtherscanLink
            chainId={props.chainId}
            txHash={props.transactionHash.toString()}
            type="tx"
          >
            <InlineEllipsis className="max-w-[200px] sm:max-w-[500px] md:max-w-[100%]">
              {props.transactionHash.toString()}
            </InlineEllipsis>
          </EtherscanLink>
        </TransactionField>
      )}
      {props.value && (
        <AssetAmountCard
          className="sm:w-1/2"
          amount={props.value.amount}
          asset={props.value.asset}
        />
      )}
      {props.trade && (
        <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <AssetAmountCard
            amountLabel="Offered amount"
            amount={props.trade.offeredAmount}
            assetLabel="Offered asset"
            asset={props.trade.offeredAsset}
          />
          <ArrowRightIcon className="hidden rounded bg-slate-800 text-zinc-500 sm:block" />
          <ArrowDownIcon className="mx-auto rounded bg-slate-800 text-zinc-500 sm:hidden" />
          <AssetAmountCard
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
