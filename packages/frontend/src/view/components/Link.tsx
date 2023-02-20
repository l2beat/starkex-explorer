import cx from 'classnames'
import React from 'react'

interface LinkProps extends React.HTMLProps<HTMLAnchorElement> {
  readonly href: string
}

export function Link({ className, href, children, ...rest }: LinkProps) {
  const isOutLink = /^https?:\/\//.test(href)
  const target = isOutLink ? '_blank' : undefined
  const rel = isOutLink ? 'noreferrer noopener' : undefined
  return (
    <a
      href={href}
      className={cx(
        'text-blue-500 underline underline-offset-[3.5px]',
        className
      )}
      target={target}
      rel={rel}
      {...rest}
    >
      {children}
    </a>
  )
}
