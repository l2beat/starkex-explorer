import React from 'react'

import { DiscordLogo } from '../logos/DiscordLogo'
import { DydxLogo } from '../logos/DydxLogo'
import { GithubLogo } from '../logos/GithubLogo'
import { L2beatLogo } from '../logos/L2beatLogo'
import { StarkWareLogo } from '../logos/StarkWareLogo'
import { TwitterLogo } from '../logos/TwitterLogo'
import { SimpleLink } from '../SimpleLink'

export function Footer() {
  return (
    <footer className="wide:px-4 mx-auto mb-12 max-w-[900px] px-2">
      <div className="border-gray-300 mb-3 flex flex-wrap justify-between gap-y-3 border-b-[1px] pb-3">
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
      <div className="flex flex-wrap justify-between gap-y-3">
        <div className="flex flex-wrap items-center text-sm">
          Built by <L2beatLogo height={18} width={44} className="mx-1" /> team
          and funded by <DydxLogo height={14} width={45} className="mx-1" /> and{' '}
          <StarkWareLogo height={18} width={98} className="ml-1" />
        </div>
        <span className="text-xs">Copyright 2022 L2BEAT</span>
      </div>
    </footer>
  )
}
