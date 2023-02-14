import React from 'react'

import { L2BeatIcon } from '../icons/L2BeatIcon'
import { StarkWareIcon } from '../icons/StarkWareIcon'

export function Footer() {
  return (
    <footer className="flex h-16 flex-wrap items-center	justify-between gap-y-3 whitespace-normal border-t border-t-zinc-800 p-6 text-sm">
      <span className="flex">
        Built by <L2BeatIcon height={18} width={44} className="mx-1" /> team and
        funded by
        <StarkWareIcon height={18} width={98} className="ml-1" />
      </span>
      <span className="text-zinc-500">@Copyright 2023 L2BEAT</span>
    </footer>
  )
}
