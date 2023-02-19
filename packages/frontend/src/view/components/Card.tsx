import cx from 'classnames'
import React from 'react'
type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div className={cx('rounded-lg bg-gray-800 p-6', className)} {...rest}>
      {children}
    </div>
  )
}
