import React from 'react'

import { L2beatExplorerLogo } from './L2beatExplorerLogo'
import { DydxLogo } from './DydxLogo'
import { SearchBar } from './SearchBar'

type NavbarProps = {
  searchBar: boolean
}

export function Navbar({ searchBar = true }: NavbarProps) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5 border-b-[1px] border-grey-300 flex-wrap gap-y-2">
      <a className="flex" href="/">
        <span className="pr-4">
          <L2beatExplorerLogo height={36} />
        </span>
        <DydxLogo height={32} />
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4 w-full lg:w-auto">
        {searchBar && <SearchBar className="lg:w-auto lg:min-w-[600px]" />}
        <button
          id="connect-with-metamask"
          className="bg-grey-300 px-4 rounded-md h-[44px] w-full lg:w-auto"
        >
          Connect
        </button>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById("connect-with-metamask").onclick = () => {
              if (typeof window.ethereum === 'undefined') {
                window.alert('MetaMask is not installed!');
                return
              }
              window.ethereum.request({ method: 'eth_requestAccounts' });
            }
          `,
        }}
      />
    </div>
  )
}
