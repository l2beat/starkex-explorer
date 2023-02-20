import React from 'react'

import { InlineEllipsis } from '../../../components/InlineEllipsis'

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
      <a href={`/state-updates/${id.toString()}`}>
        <InlineEllipsis className="max-w-[160px] text-blue-600 underline">
          #{id}
        </InlineEllipsis>
      </a>
    </span>
  )
}
