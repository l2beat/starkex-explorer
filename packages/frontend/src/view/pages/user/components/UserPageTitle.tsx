import { StarkKey } from '@explorer/types'
import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'

interface UserPageTitleProps {
  prefix: string
  starkKey: StarkKey
}

export function UserPageTitle({ prefix, starkKey }: UserPageTitleProps) {
  return (
    <span>
      {prefix}{' '}
      <Link href={`/users/${starkKey.toString()}`}>
        <InlineEllipsis className="max-w-[160px]">
          {starkKey.toString()}
        </InlineEllipsis>
      </Link>
    </span>
  )
}
