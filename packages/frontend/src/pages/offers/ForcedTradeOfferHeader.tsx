import React, { ReactNode } from 'react'

import { PageHeading } from '../common/header/PageHeading'

interface ForcedTradeOfferHeaderProps {
  type: 'buy' | 'sell' | 'exit'
  offerId: number
  children?: ReactNode
}

export function ForcedTradeOfferHeader(props: ForcedTradeOfferHeaderProps) {
  return (
    <div className="mb-8 truncate flex justify-between content-center">
      <PageHeading className="!mb-0">
        Forced {props.type} {props.offerId}
      </PageHeading>
      {props.children}
    </div>
  )
}
