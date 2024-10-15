import { PageContext } from '@explorer/shared'
import classNames from 'classnames'
import React from 'react'

import { JazzIcon } from '../../assets/icons/jazz/JazzIcon'
import { ProjectLogo } from '../../assets/logos/ProjectLogo'
import { Button } from '../Button'
import { SearchBar } from '../SearchBar'

interface NavbarProps {
  readonly context: PageContext
  readonly showSearchBar: boolean
  readonly path: string
  readonly isPreview: boolean
}

export function Navbar({
  showSearchBar = true,
  context,
  path,
  isPreview,
}: NavbarProps) {
  const { user, instanceName, tradingMode, chainId } = context
  const isMainnet = chainId === 1
  const isFork = chainId === 31337
  return (
    <div className="border-b border-zinc-800">
      <nav className="relative mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-y-2 px-6 py-2.5">
        <a
          className="flex items-center justify-center gap-2 divide-x sm:gap-4"
          href="/"
        >
          <ProjectLogo instanceName={instanceName} />
          <span className="hidden py-1 pl-2 text-zinc-500 sm:inline sm:pl-4">
            {instanceName.toUpperCase()}{' '}
            {isFork ? 'FORK' : isMainnet ? '' : 'TESTNET'} EXPLORER
          </span>
        </a>
        <NavLinks
          showL2Transactions={context.showL2Transactions}
          path={path}
          isPreview={isPreview}
        />
        <div className="flex gap-x-4 gap-y-2">
          {showSearchBar && (
            <SearchBar
              tradingMode={tradingMode}
              className="hidden lg:flex"
              expandable
            />
          )}
          {!user && (
            <Button id="connect-with-metamask">
              <span className="sm:hidden">Connect</span>
              <span className="hidden whitespace-nowrap sm:block">
                Connect wallet
              </span>
            </Button>
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

export type NavItem =
  | 'Home'
  | 'Transactions'
  | 'State updates'
  | 'Forced transactions'
  | 'Offers'

const getNavItems = (showL2Transactions: boolean) => {
  const items: { href: string; title: NavItem; previewHref?: string }[] = [
    { href: '/', title: 'Home', previewHref: '/home/with-l2-transactions' },
    { href: '/state-updates', title: 'State updates' },
    {
      href: '/forced-transactions',
      title: 'Forced transactions',
    },
    { href: '/offers', title: 'Offers' },
  ]

  if (showL2Transactions) {
    items.push({ href: '/l2-transactions', title: 'Transactions' })
  }

  return items
}

function NavLinks({
  showL2Transactions,
  path,
  isPreview,
}: {
  showL2Transactions: boolean
  path: string
  isPreview: boolean
}) {
  const navItems = getNavItems(showL2Transactions)

  return (
    <div className="NavLinks absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 transform items-center transition-opacity xl:flex">
      {navItems.map((item) => {
        const href = isPreview ? item.previewHref ?? item.href : item.href
        const isSelected = item.previewHref === path || item.href === path
        return (
          <NavLink
            key={item.title}
            href={href}
            title={item.title}
            isSelected={isSelected}
          />
        )
      })}
    </div>
  )
}
interface NavLinkProps {
  href: string
  title: string
  isSelected: boolean
}

function NavLink({ href, title, isSelected }: NavLinkProps) {
  return (
    <a
      className={classNames(
        'px-3 py-2 text-md font-semibold transition-colors hover:text-brand-darker',
        isSelected && 'text-brand'
      )}
      href={href}
    >
      {title}
    </a>
  )
}
