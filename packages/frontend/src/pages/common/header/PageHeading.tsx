import cx from 'classnames'
import React, { ReactNode } from 'react'

export interface PageHeadingProps {
  className?: string
  children?: ReactNode
}

export function PageHeading({ className, children }: PageHeadingProps) {
  return (
    <h1 className={cx('font-bold text-2xl mb-8', className)}>{children}</h1>
  )
}
