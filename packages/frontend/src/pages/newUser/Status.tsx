import cx from 'classnames'
import React from 'react'

import { EthereumTransactionEntry, OfferEntry } from './UserProps'

const backgroundMap = {
  //Offers statuses
  CREATED: 'bg-blue-400',
  ACCEPTED: 'bg-gradient-to-r from-blue-400 to-green-500',
  SENT: 'bg-green-500',
  EXPIRED: 'bg-grey-500',
  CANCELLED: 'bg-grey-500',

  //Ethereum transactions statuses
  'SENT (1/3)': 'bg-blue-400',
  'MINED (2/3)': 'bg-gradient-to-r from-blue-400 to-green-500',
  'INCLUDED (3/3)': 'bg-green-500',
  'SENT (1/2)': 'bg-blue-400',
  'MINED (2/2)': 'bg-green-500',
  REVERTED: 'bg-red-300',
}

interface StatusProps {
  status: OfferEntry['status'] | EthereumTransactionEntry['status']
}

export function Status({ status }: StatusProps) {
  return (
    <div
      className={cx(
        'px-2 py-1 rounded-full font-bold text-xs w-max',
        {
          'text-white':
            status === 'EXPIRED' ||
            status === 'CANCELLED' ||
            status === 'REVERTED',
        },
        {
          'text-background':
            status !== 'EXPIRED' &&
            status !== 'CANCELLED' &&
            status !== 'REVERTED',
        },
        backgroundMap[status]
      )}
    >
      {status}
    </div>
  )
}
