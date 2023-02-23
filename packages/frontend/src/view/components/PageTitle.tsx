import cx from 'classnames'
import React, { ReactNode } from 'react'

export interface PageTitleProps {
  className?: string
  children: ReactNode
}

export function PageTitle(props: PageTitleProps) {
  return (
    <h1 className={cx('mb-6 text-xxl font-bold', props.className)}>
      {props.children}
    </h1>
  )
}
