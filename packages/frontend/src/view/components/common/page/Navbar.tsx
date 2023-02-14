import { AccountDetails } from '@explorer/shared'
import React from 'react'
import { Button } from '../Button'
import { DydxIcon } from '../icons/DydxIcon'
import { JazzIcon } from '../icons/jazzicon/JazzIcon'
import { L2BeatMinimalIcon } from '../icons/L2BeatMinimalIcon'
import { SearchBar } from '../SearchBar'

export interface NavbarProps {
  readonly account: AccountDetails | undefined
  readonly searchBar: boolean
}

export function Navbar({ account, searchBar = true }: NavbarProps) {
  return (
    <div className="flex h-16 flex-wrap items-center justify-between gap-y-2 border-b-[1px] border-zinc-800 px-6 py-2.5">
      <a
        className="flex items-center justify-center gap-2 divide-x sm:gap-4"
        href="/"
      >
        <div className="flex gap-2 sm:gap-4">
          <L2BeatMinimalIcon className="h-[30px] sm:h-[36px]" />
          <DydxIcon className="h-[26px] sm:h-[32px]" />
        </div>
        <span className="py-1 pl-2 uppercase text-slate-400 sm:pl-4">
          Explorer
        </span>
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {searchBar && (
          <SearchBar className="hidden w-auto min-w-[400px] lg:flex" />
        )}
        {!account && <Button id="connect-with-metamask">Connect wallet</Button>}
        {account && (
          <a
            href={`/positions/${account.positionId ?? 'not-found'}`}
            className="relative flex h-[32px] items-center justify-center gap-2 rounded-md px-4 align-middle lg:h-[44px]"
          >
            <JazzIcon
              className="hidden lg:block"
              address={account.address}
              size={25}
            />
            <JazzIcon
              className="block lg:hidden"
              address={account.address}
              size={18}
            />
            <span className="font-mono">
              {account.address.slice(0, 6)}&hellip;
              <span className="hidden sm:inline">
                {account.address.slice(-4)}
              </span>
            </span>
            {account.hasUpdates && (
              <div className="absolute right-0 top-0 h-4 w-4 translate-x-1/3 rounded-full" />
            )}
          </a>
        )}
      </div>
    </div>
  )
}
