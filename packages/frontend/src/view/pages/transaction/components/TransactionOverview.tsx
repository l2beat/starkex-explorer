import { Hash256 } from '@explorer/types'
import React from 'react'

import { StatusBadge, StatusType } from '../../../components/StatusBadge'
import { TransactionField } from './TransactionField'

interface TransactionOverviewProps {
  statusType: StatusType
  statusText: string
  statusDescription: string
  transactionHash?: Hash256
}

export function TransactionOverview(props: TransactionOverviewProps) {
  return (
    <div className="flex flex-col gap-6 rounded-lg bg-gray-800 p-6">
      <TransactionField label="Current status">
        <div className="flex items-baseline gap-2">
          <StatusBadge type={props.statusType}>{props.statusText}</StatusBadge>
          <p>{props.statusDescription}</p>
        </div>
      </TransactionField>
      {props.transactionHash && (
        <TransactionField label="Transaction hash">
          <a
            href={`https://etherscan.io/tx/${props.transactionHash.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {props.transactionHash.toString()}
          </a>
        </TransactionField>
      )}
    </div>
  )
}
