import React from 'react'

import { ReplacedIcon } from '../../../assets/icons/ReplacedIcon'

interface AlternativeTransactionNoteProps {
  transactionId: number
  altIndex: number
}

export function AlternativeTransactionNote(
  props: AlternativeTransactionNoteProps
) {
  return (
    <div className="mb-4 flex rounded-lg bg-blue-300 bg-opacity-20 px-6 py-5 text-lg font-semibold">
      <ReplacedIcon className="scale-150 fill-blue-300" />
      <span className="ml-2 text-blue-300">Alternative</span>
      <span className="ml-auto">
        Please mind, this transaction is #{props.altIndex} alternative
        transaction of #{props.transactionId} transaction.
      </span>
    </div>
  )
}
