import React from 'react'
import { DiscordLogo } from './DiscordLogo'
import { DydxLogo } from './DydxLogo'
import { GithubLogo } from './GithubLogo'
import { L2beatLogo } from './L2beatLogo'
import { StarkwareLogo } from './StarkwareLogo'
import { TwitterLogo } from './TwitterLogo'

export function Footer() {
  return (
    <footer className="mt-24 mb-12">
      <div className="flex justify-between pb-3 mb-3 border-b-[1px] border-grey-300">
        <div>
          <a href="/" className="mr-3 text-blue-200 underline">
            API documentation
          </a>
          <a href="/" className="text-blue-200 underline">
            Donate
          </a>
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
      <div className="flex justify-between">
        <div className="flex items-center text-sm">
          Built by <L2beatLogo height={18} className="mx-1" /> team and funded
          by <DydxLogo height={14} className="mx-1" /> and{' '}
          <StarkwareLogo height={18} className="ml-1" />
        </div>
        <span className="text-xs">Copyright 2022 L2BEAT</span>
      </div>
    </footer>
  )
}
