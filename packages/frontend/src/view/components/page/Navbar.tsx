import { PageContext } from '@explorer/shared'
import React from 'react'

import { JazzIcon } from '../../assets/icons/jazz/JazzIcon'
import { L2BeatMinimalLogo } from '../../assets/logos/L2BeatMinimalLogo'
import { ProjectLogo } from '../../assets/logos/ProjectLogo'
import { Button } from '../Button'
import { SearchBar } from '../SearchBar'

interface NavbarProps {
  readonly context: PageContext
  readonly showSearchBar: boolean
  readonly showNavLinks?: boolean
}

export function Navbar({
  showSearchBar = true,
  showNavLinks = false,
  context,
}: NavbarProps) {
  const { user, instanceName, tradingMode, chainId } = context
  const isMainnet = chainId === 1
  return (
    <div className="border-b border-zinc-800">
      <nav className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-y-2 px-6 py-2.5">
        <a
          className="flex items-center justify-center gap-2 divide-x sm:gap-4"
          href="/"
        >
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <L2BeatMinimalLogo className="h-[30px] sm:h-[36px]" />
            <ProjectLogo instanceName={instanceName} />
          </div>
          <span className="hidden py-1 pl-2 text-zinc-500 sm:inline sm:pl-4">
            {instanceName.toUpperCase()} {isMainnet ? '' : 'TESTNET'} EXPLORER
          </span>
        </a>
        {showNavLinks && (
          <NavLinks showL2Transactions={context.showL2Transactions} />
        )}
        <div className="flex gap-x-4 gap-y-2">
          {showSearchBar && (
            <SearchBar
              tradingMode={tradingMode}
              className="hidden w-auto min-w-[515px] lg:flex"
            />
          )}
          {!user && (
            <>
              <Button id="connect-with-metamask" className="sm:hidden">
                Connect
              </Button>
              <Button
                id="connect-with-metamask"
                className="hidden whitespace-nowrap sm:block"
              >
                Connect wallet
              </Button>
            </>
          )}
          {user && (
            <a
              href={`/users/${user.starkKey?.toString() ?? 'recover'}`}
              className="relative flex h-10 items-center justify-center gap-2 rounded-md border border-transparent px-4 align-middle transition-colors hover:border-brand"
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
              <span className="font-mono whitespace-pre">
                {user.address.slice(0, 6)}&hellip;
                <span className="hidden sm:inline">
                  {user.address.slice(-4)}
                </span>
              </span>
            </a>
          )}
        </div>
      </nav>
    </div>
  )
}

function NavLinks({ showL2Transactions }: { showL2Transactions: boolean }) {
  const navItems = [
    ...(showL2Transactions
      ? [{ href: '/l2-transactions', title: 'Transactions' }]
      : []),
    { href: '/state-updates', title: 'State updates' },
    {
      href: '/forced-transactions',
      title: 'Forced transactions',
    },
    { href: '/offers', title: 'Offers' },
  ]

  return (
    <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform items-center xl:flex">
      {navItems.map((item) => {
        return <NavLink key={item.title} href={item.href} title={item.title} />
      })}
    </div>
  )
}
interface NavLinkProps {
  href: string
  title: string
}

function NavLink({ href, title }: NavLinkProps) {
  return (
    <a
      className={
        'px-3 py-2 text-md font-semibold transition-colors hover:text-brand'
      }
      href={href}
    >
      {title}
    </a>
  )
}
