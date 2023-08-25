import classNames from 'classnames'
import React from 'react'

import { InfoIcon } from '../assets/icons/InfoIcon'

interface Props {
  children: React.ReactNode
  className?: string
}

export function InfoBanner({ children, className }: Props) {
  return (
    <div
      className={classNames(
        'flex items-center justify-center rounded bg-blue-400 bg-opacity-20 p-2',
        className
      )}
    >
      <InfoIcon className="flex-shrink-0" />
      <p className="ml-2 text-center text-sm text-white sm:text-left">
        {children}
      </p>
    </div>
  )
}
