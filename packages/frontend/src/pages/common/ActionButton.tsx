import cx from 'classnames'
import React from 'react'

interface ActionButtonProps {
    readonly onClick?: () => void
    readonly className?: string
    readonly children: React.ReactNode
}

export function ActionButton({onClick, className, children}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cx(`w-32 mx-auto py-2 rounded-action-button bg-purple-100 text-white font-semibold text-sm cursor-pointer`, className)}
    >
      {children}
    </button>
  )
}
