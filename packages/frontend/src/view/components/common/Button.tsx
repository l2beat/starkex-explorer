import cx from 'classnames'
import React from 'react'

interface ButtonProps {
  readonly onClick?: () => void
  readonly className?: string
  readonly children: React.ReactNode
  readonly variant: 'ACTION' | 'VIEW_ALL'
}

export function Button({ onClick, className, variant, children }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cx(
        '!m-0 cursor-pointer',
        {
          'mx-auto w-32 rounded-action-button bg-dydx-brand-color py-2 text-sm font-semibold text-white':
            variant === 'ACTION',
        },
        {
          'rounded-lg border border-solid border-dydx-brand-color py-3 px-8 text-base font-semibold text-white':
            variant === 'VIEW_ALL',
        },
        className
      )}
    >
      {children}
    </button>
  )
}
