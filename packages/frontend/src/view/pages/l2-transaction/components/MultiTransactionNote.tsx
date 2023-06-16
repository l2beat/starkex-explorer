import React from 'react'

import { ReplacedIcon } from '../../../assets/icons/ReplacedIcon'

interface MultiTransactionNoteProps {
  multiIndex: number
}

export function MultiTransactionNote(props: MultiTransactionNoteProps) {
  return (
    <div className="mb-4 flex rounded-lg bg-yellow-300 bg-opacity-25 px-6 py-5 text-lg font-semibold">
      <ReplacedIcon className="scale-150 fill-yellow-300" />
      <span className="ml-2 text-yellow-300">Multi</span>
      <span className="ml-auto">
        This transaction is #{props.multiIndex} transaction of multi
        transaction.
      </span>
    </div>
  )
}
