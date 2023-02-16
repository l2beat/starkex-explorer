import React from 'react'

import { AccountDetails } from '../AccountDetails'
import { JazzIcon } from '../jazzicon/JazzIcon'
import { DydxLogo } from '../logos/DydxLogo'
import { L2beatExplorerLogo } from '../logos/L2beatExplorerLogo'
import { SearchBar } from '../SearchBar'

export interface NavbarProps {
  readonly account: AccountDetails | undefined
  readonly searchBar: boolean
}

export function Navbar({ account, searchBar = true }: NavbarProps) {
  return (
    <div className="wide:px-4 border-gray-300 flex flex-wrap items-center justify-between gap-y-2 border-b-[1px] px-2 py-2.5">
      <a className="flex items-center justify-center" href="/">
        <span className="pr-2 sm:pr-4">
          <L2beatExplorerLogo className="h-[30px] sm:h-[36px]" />
        </span>
        <DydxLogo className="h-[26px] sm:h-[32px]" />
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {searchBar && (
          <SearchBar className="hidden w-auto min-w-[500px] lg:flex" />
        )}
        {!account && (
          <button
            id="connect-with-metamask"
            className="bg-gray-300 h-[32px] rounded-md px-4 lg:h-[44px]"
          >
            Connect
          </button>
        )}
        {account && (
          <a
            href={`/positions/${account.positionId ?? 'not-found'}`}
            className="bg-gray-300 relative flex h-[32px] items-center justify-center gap-2 rounded-md px-4 align-middle lg:h-[44px]"
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
              <div className="absolute right-0 top-0 h-4 w-4 translate-x-1/3 translate-y-[-33%] rounded-full bg-blue-200" />
            )}
          </a>
        )}
      </div>
    </div>
  )
}
