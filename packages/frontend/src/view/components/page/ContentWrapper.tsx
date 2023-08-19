import cx from 'classnames'
import React, { ReactNode } from 'react'

interface ContentWrapperProps {
  children: ReactNode
  className?: string
}

export function ContentWrapper(props: ContentWrapperProps) {
  return (
    <main
      className={cx(
        'mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-16 md:px-8',
        props.className
      )}
    >
      {props.children}
    </main>
  )
}
