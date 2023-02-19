import { StarkKey } from '@explorer/types'
import React from 'react'

interface UserPageTitleProps {
  prefix: string
  starkKey: StarkKey
}

export function UserPageTitle({ prefix, starkKey }: UserPageTitleProps) {
  return (
    <span>
      {prefix}{' '}
      <a
        href={`/user/${starkKey.toString()}`}
        className="relative top-[7px] inline-block max-w-[160px] truncate py-1 text-blue-600 underline"
      >
        {starkKey.toString()}
      </a>
    </span>
  )
}
