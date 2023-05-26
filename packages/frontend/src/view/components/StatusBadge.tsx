import cx from 'classnames'
import React, { ReactNode } from 'react'

export type StatusType = 'BEGIN' | 'MIDDLE' | 'END' | 'ERROR' | 'CANCEL'

interface StatusBadgeProps {
  type: StatusType
  children: ReactNode
}

export function StatusBadge({ type, children }: StatusBadgeProps) {
  return (
    <div
      className={cx(
        'w-max whitespace-pre rounded-full px-2 py-1 text-xxs font-bold',
        type === 'BEGIN' && 'bg-sky-400 text-black',
        type === 'MIDDLE' &&
          'bg-gradient-to-r from-sky-400 to-green-400 text-black',
        type === 'END' && 'bg-green-400 text-black',
        type === 'ERROR' && 'bg-red-600 text-white',
        type === 'CANCEL' && 'bg-zinc-500 text-white'
      )}
    >
      {children}
    </div>
  )
}
