import cx from 'classnames'
import React, { ReactNode } from 'react'

export interface ContentWrapperProps {
  children: ReactNode
  className?: string
}

export function ContentWrapper(props: ContentWrapperProps) {
  return (
    <main
      className={cx('mx-auto w-full max-w-[960px] py-16 px-2', props.className)}
    >
      {props.children}
    </main>
  )
}
