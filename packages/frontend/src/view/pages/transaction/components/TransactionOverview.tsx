import { Hash256, Timestamp } from '@explorer/types'
import React from 'react'

import { Asset } from '../../../../utils/assets'
import { formatTimestamp } from '../../../../utils/formatting/formatTimestamp'
import { ArrowRightIcon } from '../../../assets/icons/ArrowIcon'
import { Link } from '../../../components/Link'
import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { AmountContainer } from './AmountContainer'
import { TransactionField } from './TransactionField'

interface TransactionOverviewProps {
  statusType: StatusType
  statusText: string
  statusDescription: string
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
            {props.stateUpdateId && props.statusType === 'END' && (
              <Link href={`/state-updates/${props.stateUpdateId}`}>
                #{props.stateUpdateId}
              </Link>
            )}
          </div>
        </TransactionField>
        {props.timestamp && (
          <TransactionField
            label={props.timestamp.label}
            className="text-right"
          >
            {formatTimestamp(props.timestamp.timestamp, 'utc')} UTC{' '}
            <span className="text-zinc-500">
              ({delayDays} {delayDays === 1 ? 'day' : 'days'})
            </span>
          </TransactionField>
        )}
      </div>
      {props.transactionHash && (
        <TransactionField label="Transaction hash">
          <Link
            href={`https://etherscan.io/tx/${props.transactionHash.toString()}`}
          >
            {props.transactionHash.toString()}
          </Link>
        </TransactionField>
      )}
      {props.value && (
        <AmountContainer
          className="w-1/2"
          amountLabel="Amount"
          amount={props.value.amount}
          assetLabel="Asset"
          asset={props.value.asset}
        />
      )}
      {props.trade && (
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <AmountContainer
            amountLabel="Offered amount"
            amount={props.trade.offeredAmount}
            assetLabel="Offered asset"
            asset={props.trade.offeredAsset}
          />
          <ArrowRightIcon className="rounded bg-slate-800 text-zinc-500" />
          <AmountContainer
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
