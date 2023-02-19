import { StarkKey } from '@explorer/types'
import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'

interface UserPageTitleProps {
  prefix: string
  starkKey: StarkKey
}

export function UserPageTitle({ prefix, starkKey }: UserPageTitleProps) {
  return (
    <span>
      {prefix}{' '}
      <a href={`/user/${starkKey.toString()}`}>
        <InlineEllipsis className="max-w-[160px] text-blue-600 underline">
          {starkKey.toString()}
        </InlineEllipsis>
      </a>
    </span>
  )
}
