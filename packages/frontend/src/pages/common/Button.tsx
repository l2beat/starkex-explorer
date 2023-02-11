import cx from 'classnames'
import React from 'react'

interface ButtonProps {
    readonly onClick?: () => void
    readonly className?: string
    readonly children: React.ReactNode
    readonly variant: "ACTION" | "VIEW_ALL"
}

export function Button({onClick, className, variant, children}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cx('cursor-pointer !m-0', {'w-32 mx-auto py-2 rounded-action-button bg-dydx-brand-color text-white font-semibold text-sm': variant === "ACTION"}, {'text-white font-semibold border border-solid border-dydx-brand-color rounded-lg py-3 px-8 text-base': variant === "VIEW_ALL"}, className)}
    >
      {children}
    </button>
  )
}
