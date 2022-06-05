import cx from 'classnames'
import React, { ReactNode } from 'react'

export interface SectionHeadingProps {
  className?: string
  active?: boolean
  children?: ReactNode
}

export function SectionHeading({
  className,
  active,
  children,
}: SectionHeadingProps) {
  return (
    <h2
      className={cx(
        'mb-1.5 font-medium text-lg text-left',
        active &&
          'after:ml-1 after:inline-block after:w-4 after:h-4 after:bg-blue-200 after:rounded-full',
        className
      )}
    >
      {children}
    </h2>
  )
}
