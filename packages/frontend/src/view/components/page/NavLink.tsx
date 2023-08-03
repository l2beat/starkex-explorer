import classNames from 'classnames'
import React from 'react'

interface NavLinkProps {
  href: string
  title: NavLinkTitle
  isSelected: boolean
}

export type NavLinkTitle =
  | 'Home'
  | 'State updates'
  | 'Live transactions'
  | 'Forced transactions'
  | 'Offers'

export function NavLink({ href, title, isSelected }: NavLinkProps) {
  return (
    <a
      className={classNames(
        'px-3 py-2 text-md font-semibold transition-colors hover:text-brand',
        isSelected && 'text-brand'
      )}
      href={href}
    >
      {title}
    </a>
  )
}
