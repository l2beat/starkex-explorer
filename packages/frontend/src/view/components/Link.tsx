import cx from 'classnames'
import React from 'react'

import { OutLinkIcon } from '../assets/icons/OutLinkIcon'

type LinkProps = React.HTMLProps<HTMLAnchorElement> & {
  accessoryLeft?: React.ReactNode
  accessoryRight?: React.ReactNode
}

export function Link({
  className,
  href,
  children,
  accessoryLeft,
  accessoryRight,
  ...rest
}: LinkProps) {
  const isOutLink = /^https?:\/\//.test(href ?? '')
  const target = isOutLink ? '_blank' : undefined
  const rel = isOutLink ? 'noreferrer noopener' : undefined
  const hasHref = href != null
  const classNames = cx(
    'group inline-flex gap-2 items-center text-blue-500 fill-blue-500 hover:fill-blue-600 hover:text-blue-600 underline underline-offset-[3.5px] transition-colors',
    className
  )
  return hasHref ? (
    <a href={href} className={classNames} target={target} rel={rel} {...rest}>
      {accessoryLeft}
      {children}
      {isOutLink && <OutLinkIcon className="group-hover:stroke-blue-600" />}
      {accessoryRight}
    </a>
  ) : (
    <span className={classNames} {...rest}>
      {children}
    </span>
  )
}
