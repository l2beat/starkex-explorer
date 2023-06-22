import React from 'react'

import { ReplacedTransactionIcon } from '../../../assets/icons/ReplacedTransactionIcon'

export function ReplacedTransactionBanner() {
  return (
    <div className="flex items-center rounded-lg bg-yellow-300 bg-opacity-20 px-6 py-5 text-lg font-semibold">
      <ReplacedTransactionIcon className="fill-yellow-300" />
      <span className="ml-2 mr-12 text-yellow-300">Replaced</span>
      <span className="ml-auto">
        Please mind, this transaction is replaced by alternatives listed below.
      </span>
    </div>
  )
}
