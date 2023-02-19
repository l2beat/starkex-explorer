import { UserDetails } from '@explorer/shared'
import React from 'react'

import { JazzIcon } from '../../assets/icons/jazz/JazzIcon'
import { DydxLogo } from '../../assets/logos/DydxLogo'
import { L2BeatMinimalLogo } from '../../assets/logos/L2BeatMinimalLogo'
import { Button } from '../Button'
import { SearchBar } from '../SearchBar'

export interface NavbarProps {
  readonly user: UserDetails | undefined
  readonly searchBar: boolean
}

export function Navbar({ user, searchBar = true }: NavbarProps) {
  return (
    <div className="flex h-16 flex-wrap items-center justify-between gap-y-2 border-b border-zinc-800 px-6 py-2.5">
      <a
        className="flex items-center justify-center gap-2 divide-x sm:gap-4"
        href="/"
      >
        <div className="flex gap-2 sm:gap-4">
          <L2BeatMinimalLogo className="h-[30px] sm:h-[36px]" />
          <DydxLogo className="h-[26px] sm:h-8" />
        </div>
        <span className="py-1 pl-2 uppercase text-zinc-500 sm:pl-4">
          Explorer
        </span>
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {searchBar && (
          <SearchBar className="hidden w-auto min-w-[400px] lg:flex" />
        )}
        {!user && <Button id="connect-with-metamask">Connect wallet</Button>}
        {user && (
          <a
            href={`/user/${user.starkKey?.toString() ?? 'not-found'}`}
            className="relative flex h-8 items-center justify-center gap-2 rounded-md border border-transparent px-4 align-middle hover:border-brand lg:h-[44px]"
          >
            <JazzIcon
              className="hidden lg:block"
              address={user.address}
              size={25}
            />
            <JazzIcon
              className="block lg:hidden"
              address={user.address}
              size={18}
            />
            <span className="font-mono">
              {user.address.slice(0, 6)}&hellip;
              <span className="hidden sm:inline">{user.address.slice(-4)}</span>
            </span>
          </a>
        )}
      </div>
    </div>
  )
}
