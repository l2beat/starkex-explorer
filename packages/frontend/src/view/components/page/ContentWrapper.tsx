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
        'mx-auto w-full max-w-[1024px] flex-1 py-16 px-4 sm:px-8',
        props.className
      )}
    >
      {props.children}
    </main>
  )
}
