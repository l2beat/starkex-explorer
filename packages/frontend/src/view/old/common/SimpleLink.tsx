import cx from 'classnames'
import React, { ReactNode } from 'react'

export function SimpleLink({
  className,
  href,
  children,
}: {
  className?: string
  href: string
  children: ReactNode
}) {
  const isOutLink = /^https?:\/\//.test(href)
  const target = isOutLink ? '_blank' : undefined
  const rel = isOutLink ? 'noreferrer noopener' : undefined
  return (
    <a
      href={href}
      className={cx('text-blue-200 underline', className)}
      target={target}
      rel={rel}
    >
      {children}
    </a>
  )
}
