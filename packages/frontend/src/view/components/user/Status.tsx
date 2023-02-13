import cx from 'classnames'
import React, { ReactNode } from 'react'

export type StatusType = 'BEGIN' | 'MIDDLE' | 'END' | 'ERROR' | 'CANCEL'

export interface StatusProps {
  type: StatusType
  children: ReactNode
}

export function Status({ type, children }: StatusProps) {
  return (
    <div
      className={cx(
        'w-max rounded-full px-2 py-1 text-xs font-bold',
        type === 'BEGIN' && 'bg-blue-400',
        type === 'MIDDLE' && 'bg-gradient-to-r from-blue-400 to-green-500',
        type === 'END' && 'bg-green-500',
        type === 'ERROR' && 'bg-red-300 text-white',
        type === 'CANCEL' && 'bg-grey-500 text-white'
      )}
    >
      {children}
    </div>
  )
}
