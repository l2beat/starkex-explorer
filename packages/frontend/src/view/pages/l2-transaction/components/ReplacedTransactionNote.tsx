import React from 'react'

import { ReplacedIcon } from '../../../assets/icons/ReplacedIcon'

export function ReplacedTransactionNote() {
  return (
    <div className="mb-4 flex rounded-lg bg-yellow-700 bg-opacity-25 px-6 py-5 text-lg font-semibold">
      <ReplacedIcon className="scale-150 fill-yellow-700" />
      <span className="ml-2 text-yellow-700">Replaced</span>
      <span className="ml-auto">
        Please mind, this transaction is replaced by alternatives listed below.
      </span>
    </div>
  )
}
