import React from 'react'
import { DiscordLogo } from './logos/DiscordLogo'
import { DydxLogo } from './logos/DydxLogo'
import { GithubLogo } from './logos/GithubLogo'
import { L2beatLogo } from './logos/L2beatLogo'
import { SimpleLink } from './SimpleLink'
import { StarkWareLogo } from './logos/StarkWareLogo'
import { TwitterLogo } from './logos/TwitterLogo'

export function Footer() {
  return (
    <footer className="mt-24 mb-12">
      <div className="flex justify-between pb-3 mb-3 border-b-[1px] border-grey-300 flex-wrap gap-y-3">
        <div>
          <SimpleLink href="/" className="mr-3">
            API documentation
          </SimpleLink>
          <SimpleLink href="/">Donate</SimpleLink>
        </div>
        <div className="flex">
          <a href="/">
            <TwitterLogo height={24} className="mr-3" />
          </a>
          <a href="/">
            <DiscordLogo height={24} className="mr-3" />
          </a>
          <a href="/">
            <GithubLogo height={24} />
          </a>
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
