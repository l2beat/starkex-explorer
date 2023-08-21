import classNames from 'classnames'
import React from 'react'

import { CopyButton } from './CopyButton'

interface LongHashProps {
  className?: string
  children: string | string[]
  withCopy?: boolean
}

export function LongHash({
  children,
  className,
  withCopy = false,
}: LongHashProps) {
  return (
    <span className={classNames('break-words', className)}>
      {children}{' '}
      {withCopy && <CopyButton content={getCopyButtonContent(children)} />}
    </span>
  )
}

function getCopyButtonContent(content: string | string[]) {
  return Array.isArray(content) ? content.join('') : content
}
