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
    <div className="flex justify-between items-center px-2 wide:px-4 py-2.5 border-b-[1px] border-grey-300 flex-wrap gap-y-2">
      <a className="flex justify-center items-center" href="/">
        <span className="pr-2 sm:pr-4">
          <L2beatExplorerLogo className="h-[30px] sm:h-[36px]" />
        </span>
        <DydxLogo className="h-[26px] sm:h-[32px]" />
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {searchBar && (
          <SearchBar className="hidden lg:flex w-auto min-w-[500px]" />
        )}
        {!account && (
          <button
            id="connect-with-metamask"
            className="bg-grey-300 px-4 rounded-md h-[32px] lg:h-[44px]"
          >
            Connect
          </button>
        )}
        {account && (
          <a
            href={`/positions/${account.positionId ?? 'not-found'}`}
            className="bg-grey-300 px-4 rounded-md h-[32px] lg:h-[44px] align-middle flex items-center justify-center gap-2 relative"
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
              <div className="rounded-full bg-blue-200 h-4 w-4 absolute right-0 top-0 translate-x-1/3 translate-y-[-33%]" />
            )}
          </a>
        )}
      </div>
    </div>
  )
}
