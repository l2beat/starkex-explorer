import React from 'react'

import { L2beatExplorerLogo } from './L2beatExplorerLogo'
import { DydxLogo } from './DydxLogo'

export function Navbar() {
  return (
    <div className="flex justify-between items-center h-16 px-4 border-b-[1px] border-grey-300">
      <div className="flex">
        <span className="pr-4">
          <L2beatExplorerLogo height={36} />
        </span>
        <DydxLogo height={32} />
      </div>
      <button
        id="connect-with-metamask"
        className="bg-grey-300 px-4 rounded-md h-[44px]"
      >
        Connect
      </button>
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
