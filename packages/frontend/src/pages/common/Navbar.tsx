import React from 'react'

export function Navbar() {
  return (
    <div className="flex justify-between items-center h-12">
      <div>
        <span className="mr-4">L2BEAT</span>
        <span>dYdX</span>
      </div>
      <button
        id="connect-with-metamask"
        className="hover:bg-zinc-100 p-2 -m-2 rounded-md"
      >
        Connect with Metamask
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
