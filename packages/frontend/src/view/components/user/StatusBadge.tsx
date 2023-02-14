import cx from 'classnames'
import React, { ReactNode } from 'react'

export type StatusType = 'BEGIN' | 'MIDDLE' | 'END' | 'ERROR' | 'CANCEL'

export interface StatusBadgeProps {
  type: StatusType
  children: ReactNode
}

export function StatusBadge({ type, children }: StatusBadgeProps) {
  return (
    <div
      className={cx(
        'w-max rounded-full px-2 py-1 text-xs font-bold',
        type === 'BEGIN' && 'bg-blue-400',
        type === 'MIDDLE' && 'bg-gradient-to-r from-blue-400 to-green-500',
        type === 'END' && 'bg-green-500',
        type === 'ERROR' && 'bg-red-600 text-white',
        type === 'CANCEL' && 'bg-zinc-500 text-white'
      )}
    >
      {children}
    </div>
  )
}
