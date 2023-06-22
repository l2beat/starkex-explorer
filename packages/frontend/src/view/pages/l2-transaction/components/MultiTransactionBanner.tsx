import React from 'react'

import { MultiTransactionIcon } from '../../../assets/icons/MultiTransactionIcon'

interface MultiTransactionNoteProps {
  multiIndex: number
}

export function MultiTransactionBanner(props: MultiTransactionNoteProps) {
  return (
    <div className="flex items-center rounded-lg bg-orange-500 bg-opacity-25 px-6 py-5 text-lg font-semibold">
      <MultiTransactionIcon className="fill-orange-500" />
      <span className="ml-2 mr-12 text-orange-500">Multi transaction</span>
      <span className="ml-auto">
        This transaction is #{props.multiIndex} transaction of multi
        transaction.
      </span>
    </div>
  )
}
