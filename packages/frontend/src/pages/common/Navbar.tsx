import React from 'react'

import { L2beatLogo } from './L2beatLogo'
import { DydxLogo } from './DydxLogo'

export function Navbar() {
  return (
    <div className="flex justify-between items-center h-16 px-4 border-b-[1px] border-grey-300">
      <div className="flex">
        <span className="pr-4"><L2beatLogo /></span>
        <DydxLogo />
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
