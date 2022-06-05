import { Hash256 } from '@explorer/types'
import React, { ReactNode } from 'react'

import { formatHashShort } from '../../formatting'
import { PageHeading } from './PageHeading'

interface ForcedPageHeaderProps {
  type: 'buy' | 'sell' | 'exit'
  displayId: number | Hash256
  children?: ReactNode
}

export function ForcedPageHeader(props: ForcedPageHeaderProps) {
  return (
    <div className="mb-8 truncate flex justify-between content-center">
      <PageHeading className="!mb-0">
        Forced {props.type} {renderId(props.displayId)}
      </PageHeading>
      {props.children}
    </div>
  )
}

function renderId(displayId: number | Hash256): string {
  return typeof displayId === 'number'
    ? `#${displayId}`
    : formatHashShort(displayId)
}
