import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'
import { Link } from '../../../components/Link'

interface StateUpdatePageTitleProps {
  prefix: string
  id: string
}

export function StateUpdatePageTitle({
  prefix,
  id,
}: StateUpdatePageTitleProps) {
  return (
    <span>
      {prefix}{' '}
      <Link href={`/state-updates/${id.toString()}`}>
        <InlineEllipsis className="max-w-[160px]">#{id}</InlineEllipsis>
      </Link>
    </span>
  )
}
