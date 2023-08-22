import React from 'react'

import { AlternativeTransactionIcon } from '../../../assets/icons/AlternativeTransactionIcon'
import { Link } from '../../../components/Link'

interface AlternativeTransactionNoteProps {
  transactionId: number
  altIndex: number
}

export function AlternativeTransactionBanner(
  props: AlternativeTransactionNoteProps
) {
  return (
    <div className="-mx-4 flex flex-col gap-3 rounded-lg bg-cyan-400 bg-opacity-20 px-6 py-5 text-lg font-semibold sm:mx-0 sm:flex-row sm:items-center">
      <div className="flex items-center">
        <AlternativeTransactionIcon className="flex-shrink-0 fill-cyan-400" />
        <span className="ml-2 mr-12 text-cyan-400">Alternative</span>
      </div>
      <span className="sm:ml-auto">
        Please mind, this transaction is alternative transaction #
        {props.altIndex} of transaction{' '}
        <Link href={`/l2-transactions/${props.transactionId}`}>
          #{props.transactionId}
        </Link>
        .
      </span>
    </div>
  )
}
