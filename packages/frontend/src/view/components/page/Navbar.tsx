import { UserDetails } from '@explorer/shared'
import React from 'react'

import { InstanceName } from '../../../utils/instance'
import { getTradingMode } from '../../../utils/tradingMode'
import { JazzIcon } from '../../assets/icons/jazz/JazzIcon'
import { L2BeatMinimalLogo } from '../../assets/logos/L2BeatMinimalLogo'
import { ProjectLogo } from '../../assets/logos/ProjectLogo'
import { Button } from '../Button'
import { SearchBar } from '../SearchBar'
import { Popup } from '../Popup'

export interface NavbarProps {
  readonly user: UserDetails | undefined
  readonly searchBar: boolean
  readonly instanceName: InstanceName
}

export function Navbar({ user, searchBar = true, instanceName }: NavbarProps) {

    return (
    const tradingMode = getTradingMode()
    <div className="flex h-16 flex-wrap items-center justify-between gap-y-2 border-b border-zinc-800 px-6 py-2.5">
      <a
        className="flex items-center justify-center gap-2 divide-x sm:gap-4"
        href="/"
      >
        <div className="flex gap-2 sm:gap-4">
          <L2BeatMinimalLogo className="h-[30px] sm:h-[36px]" />
          <ProjectLogo projectName={instanceName} />
        </div>
        <span className="py-1 pl-2 text-zinc-500 sm:pl-4">
          EXPLORER (Development version);
        </span>
      </a>
      <div className="flex flex-wrap gap-y-2 gap-x-4">
        {searchBar && (
          <SearchBar
            tradingMode={tradingMode}
            className="hidden w-auto min-w-[400px] lg:flex"
          />
        )}
        {!user && <Button id="connect-with-global-button">Connect</Button>}
        <Popup id="popup" trigger={true}>
          <div className="flex gap-4 flex-wrap">
            <div className='text-zinc-500 absolute left-40 top-10 font-bold'>Connect a Wallet</div>
            {!user && <button className="absolute inset-x-20 top-20 text-zinc-500 p-4 rounded text-left bg-gray-200 hover:border" id="connect-with-metamask">Metamask</button>}                
            {!user && <img className="absolute right-24 top-24 w-8"src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/1024px-MetaMask_Fox.svg.png" alt="fsd"/>}
            {!user && <button className="absolute inset-x-20 top-40 text-zinc-500 p-4 rounded text-left bg-gray-200 hover:border" id="connect-with-wallet-connect">Wallet Connect</button>}
            {!user && <img className="absolute right-24 top-44 w-8"src="https://workablehr.s3.amazonaws.com/uploads/account/open_graph_logo/492879/social?1675329233000" alt="fsd"/>}   
           
          </div>
        </Popup>
        {user && (user.is_wallet_connect) && <Button id="disconnect-wallet-connect">Disconnect</Button>}
      
        {user && (
          <a
            href={`/users/${user.starkKey?.toString() ?? 'not-found'}`}
            className="relative flex h-10 items-center justify-center gap-2 rounded-md border border-transparent px-4 align-middle hover:border-brand"
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
