import { PageContext } from '@explorer/shared'
import React from 'react'

import { JazzIcon } from '../../assets/icons/jazz/JazzIcon'
import { L2BeatMinimalLogo } from '../../assets/logos/L2BeatMinimalLogo'
import { ProjectLogo } from '../../assets/logos/ProjectLogo'
import { Button } from '../Button'
import { SearchBar } from '../SearchBar'
import { NavLink, NavLinkTitle } from './NavLink'

interface NavbarProps {
  readonly context: PageContext
  readonly searchBar: boolean
  readonly path: string
}

export function Navbar({ searchBar = true, context, path }: NavbarProps) {
  const { user, instanceName, tradingMode, chainId } = context
  const isMainnet = chainId === 1
  const navItems = getNavLinks(context.showL2Transactions)
  return (
    <div>
      <div className="relative flex h-16 flex-wrap items-center justify-between gap-y-2 border-b border-zinc-800 px-6 py-2.5">
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
        <div className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform items-center xl:flex">
          {navItems.map((item) => {
            const isSelected =
              path.startsWith(item.href) ||
              (item.activeOn
                ? item.activeOn.some((link) => path.startsWith(link))
                : false)
            return (
              <NavLink
                key={item.title}
                href={item.href}
                title={item.title}
                isSelected={isSelected}
              />
            )
          })}
        </div>
        <div className="flex flex-wrap gap-y-2 gap-x-4">
          {searchBar && (
            <SearchBar
              tradingMode={tradingMode}
              expandable
              className="hidden lg:flex"
            />
          )}
          {!user && <Button id="connect-with-metamask">Connect wallet</Button>}
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
              <span className="font-mono">
                {user.address.slice(0, 6)}&hellip;
                <span className="hidden sm:inline">
                  {user.address.slice(-4)}
                </span>
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function getNavLinks(showL2Transactions: boolean) {
  const navItems: { href: string; title: NavLinkTitle; activeOn?: string[] }[] =
    [{ href: '/home', title: 'Home' }]

  if (showL2Transactions) {
    navItems.push({ href: '/l2-transactions', title: 'Live transactions' })
  }

  navItems.push(
    { href: '/state-updates', title: 'State updates' },
    {
      href: '/forced-transactions',
      title: 'Forced transactions',
      activeOn: ['/transactions'],
    },
    { href: '/offers', title: 'Offers' }
  )
  return navItems
}
