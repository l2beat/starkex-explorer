import { Hash256 } from '@explorer/types'
import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { PageTitle } from '../../../components/PageTitle'

export interface TransactionPageTitleProps {
  title: string
  transactionHash: Hash256
}

export function TransactionPageTitle(props: TransactionPageTitleProps) {
  return (
    <PageTitle>
      {props.title}{' '}
      <InlineEllipsis className="max-w-[160px]">
        {props.transactionHash.toString()}
      </InlineEllipsis>
    </PageTitle>
  )
}
