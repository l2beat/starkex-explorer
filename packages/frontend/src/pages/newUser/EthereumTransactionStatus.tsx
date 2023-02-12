import cx from 'classnames'
import React from 'react'

import { EthereumTransactionEntry } from './UserProps'

const backgroundMap = {
  'SENT (1/3)': 'bg-blue-400',
  'MINED (2/3)': 'bg-gradient-to-r from-blue-400 to-green-500',
  'INCLUDED (3/3)': 'bg-green-500',
  'SENT (1/2)': 'bg-blue-400',
  'MINED (2/2)': 'bg-green-500',
  REVERTED: 'bg-red-300',
}

interface EthereumTransactionStatusProps {
  status: EthereumTransactionEntry['status']
}

export function EthereumTransactionStatus({
  status,
}: EthereumTransactionStatusProps) {
  return (
    <div
      className={cx(
        'px-2 py-1 rounded-full font-bold text-xs w-max',
        { 'text-background': status !== 'REVERTED' },
        { 'text-white': status === 'REVERTED' },
        backgroundMap[status]
      )}
    >
      {status}
    </div>
  )
}
