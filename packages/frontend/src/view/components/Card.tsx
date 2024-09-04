import cx from 'classnames'
import React from 'react'
type CardProps = React.HTMLAttributes<HTMLDivElement>

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'Card group/card -mx-4 rounded-none bg-gray-800 p-6 sm:mx-0 sm:rounded-lg',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
