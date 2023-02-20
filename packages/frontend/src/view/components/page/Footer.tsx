import React from 'react'

import { L2BeatLogo } from '../../assets/logos/L2BeatLogo'
import { StarkWareLogo } from '../../assets/logos/StarkWareLogo'

export function Footer() {
  return (
    <footer className="flex flex-wrap items-baseline	justify-between gap-y-3 whitespace-normal border-t border-t-zinc-800 p-6 text-sm">
      <span>
        Built by{' '}
        <L2BeatLogo
          height={18}
          width={44}
          className="relative top-[-2px] mx-1 inline-block"
        />{' '}
        team and funded by
        <StarkWareLogo height={18} width={98} className="ml-1 inline-block" />
      </span>
      <span className="text-zinc-500">
        Copyright {new Date().getFullYear()} L2BEAT
      </span>
    </footer>
  )
}
