import { Hash256 } from '@explorer/types'
import React from 'react'

import { formatHashShort } from '../formatting'

function renderId(displayId: ForcedPageHeaderProps['displayId']): string {
  return typeof displayId === 'number'
    ? `#${displayId}`
    : formatHashShort(displayId)
}

interface ForcedPageHeaderProps {
  type: 'buy' | 'sell' | 'exit'
  displayId: number | Hash256
}

export function ForcedPageHeader(props: ForcedPageHeaderProps) {
  return (
    <h1 className="font-sans font-bold text-2xl mb-12 overflow-x-hidden text-ellipsis whitespace-nowrap">
      Forced {props.type} {renderId(props.displayId)}
    </h1>
  )
}
