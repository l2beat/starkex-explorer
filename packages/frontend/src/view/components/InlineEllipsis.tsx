import cx from 'classnames'
import React, { ReactNode } from 'react'

interface InlineEllipsisProps {
  children: ReactNode
  href?: string
  className?: string
}

/**
 * This is needed because a naive implementation of inline ellipsis pushes
 * elements upwards and hides underline because of overflow.
 */
export function InlineEllipsis({ children, className }: InlineEllipsisProps) {
  return (
    <span className="relative inline-flex items-baseline">
      <span className={cx('-my-1 inline-block truncate py-1', className)}>
        {children}
      </span>
    </span>
  )
}
