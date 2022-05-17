import React from 'react'

import { DiscordLogo } from './logos/DiscordLogo'
import { DydxLogo } from './logos/DydxLogo'
import { GithubLogo } from './logos/GithubLogo'
import { L2beatLogo } from './logos/L2beatLogo'
import { StarkWareLogo } from './logos/StarkWareLogo'
import { TwitterLogo } from './logos/TwitterLogo'
import { SimpleLink } from './SimpleLink'

export function Footer() {
  return (
    <footer className="mt-24 mb-12">
      <div className="flex justify-between pb-3 mb-3 border-b-[1px] border-grey-300 flex-wrap gap-y-3">
        <SimpleLink href="https://l2beat.com/donate">Donate</SimpleLink>
        <div className="flex gap-3">
          <SimpleLink href="https://twitter.com/l2beatcom">
            <TwitterLogo height={24} />
          </SimpleLink>
          <SimpleLink href="https://discord.gg/eaVKXPmtWk">
            <DiscordLogo height={24} />
          </SimpleLink>
          <SimpleLink href="https://github.com/l2beat/dydx-state-explorer/">
            <GithubLogo height={24} />
          </SimpleLink>
        </div>
      </div>
      <div className="flex justify-between flex-wrap gap-y-3">
        <div className="flex items-center text-sm flex-wrap">
          Built by <L2beatLogo height={18} width={44} className="mx-1" /> team
          and funded by <DydxLogo height={14} width={45} className="mx-1" /> and{' '}
          <StarkWareLogo height={18} width={98} className="ml-1" />
        </div>
        <span className="text-xs">Copyright 2022 L2BEAT</span>
      </div>
    </footer>
  )
}
