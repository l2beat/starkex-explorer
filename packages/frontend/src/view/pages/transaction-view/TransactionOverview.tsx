import React from 'react'

import { StatusBadge } from '../../components/StatusBadge'
import { toStatusType } from '../user/components/UserTransactionsTable'

interface TransactionOverviewProps {
  currentStatus: 'SENT (1/2)' | 'MINED (2/2)' | 'REVERTED' // TODO: Add all possible statuses
  transactionHash: string
  stateUpdateId: number
  children: React.ReactNode
}

export function TransactionOverview(props: TransactionOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-xxl font-semibold text-white">
        Transaction{' '}
        <span className="text-blue-600 underline">
          #{props.transactionHash.substring(0, 7)}...
        </span>
      </p>
      <div className="flex flex-col items-center gap-6 rounded-lg bg-gray-800 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-zinc-500">Current status</p>
          <div className="flex items-center justify-start gap-2">
            <StatusBadge
              type={toStatusType(props.currentStatus)}
              children={props.currentStatus}
            />
            <p className="text-lg font-semibold text-white">
              Transaction included in state update{' '}
              <span className="text-blue-600 underline">
                #{props.stateUpdateId}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-zinc-500">
            Transaction hash
          </p>
          <p className="text-lg text-blue-600 underline">
            {props.transactionHash}
          </p>
        </div>
        {props.children}
      </div>
    </div>
  )
}
