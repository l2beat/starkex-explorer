import React from 'react'

import { MultiTransactionIcon } from '../../../assets/icons/MultiTransactionIcon'
import { Link } from '../../../components/Link'

interface MultiTransactionNoteProps {
  transactionId: number
  multiIndex: number
}

export function MultiTransactionBanner(props: MultiTransactionNoteProps) {
  return (
    <div className="-mx-4 flex flex-col gap-3 rounded-lg bg-orange-500 bg-opacity-25 px-6 py-5 text-lg font-semibold sm:mx-0 sm:flex-row sm:items-center">
      <div className="flex items-center">
        <MultiTransactionIcon className="flex-shrink-0 fill-orange-500" />
        <span className="ml-2 mr-12 text-orange-500">Multi transaction</span>
      </div>
      <span className="sm:ml-auto">
        This transaction is #{props.multiIndex} transaction of multi transaction{' '}
        <Link href={`/l2-transactions/${props.transactionId}`}>
          #{props.transactionId}
        </Link>
        .
      </span>
    </div>
  )
}
