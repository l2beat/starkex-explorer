import cx from 'classnames'
import React from 'react'

interface ChangeTextProps {
  children: string
  className?: string
}

export function ChangeText({ children, className }: ChangeTextProps) {
  return (
    <span
      className={cx(
        children.startsWith('-') && 'text-red-400',
        children.startsWith('+') && 'text-emerald-400',
        children.startsWith('0') && 'text-zinc-500',
        className
      )}
    >
      {children}
    </span>
  )
}
