import React from 'react'

import { ReplacedTransactionIcon } from '../../../assets/icons/ReplacedTransactionIcon'

export function ReplacedTransactionBanner() {
  return (
    <div className="-mx-4 flex flex-col gap-3 rounded-lg bg-yellow-300 bg-opacity-20 px-6 py-5 text-lg font-semibold sm:mx-0 sm:flex-row sm:items-center">
      <div className="flex items-center">
        <ReplacedTransactionIcon className="flex-shrink-0 fill-yellow-300" />
        <span className="ml-2 mr-12 text-yellow-300">Replaced</span>
      </div>
      <span className="sm:ml-auto">
        Please mind, this transaction is replaced by alternatives listed below.
      </span>
    </div>
  )
}
