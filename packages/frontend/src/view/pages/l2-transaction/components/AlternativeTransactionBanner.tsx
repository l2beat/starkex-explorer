import React from 'react'

import { AlternativeTransactionIcon } from '../../../assets/icons/AlternativeTransactionIcon'

interface AlternativeTransactionNoteProps {
  transactionId: number
  altIndex: number
  multiIndex: number | undefined
}

export function AlternativeTransactionBanner(
  props: AlternativeTransactionNoteProps
) {
  return (
    <div className="flex items-center rounded-lg bg-cyan-400 bg-opacity-20 px-6 py-5 text-lg font-semibold">
      <AlternativeTransactionIcon className="fill-cyan-400" />
      <span className="ml-2 mr-12 text-cyan-400">Alternative</span>
      <span className="ml-auto">
        Please mind, this transaction is{' '}
        {props.multiIndex !== undefined ? 'part of' : ''} #{props.altIndex}{' '}
        alternative transaction.
      </span>
    </div>
  )
}
