import cx from 'classnames'
import React, { ReactNode } from 'react'

interface SectionHeadingProps {
  title: ReactNode
  description?: ReactNode
  leftAlign?: boolean
  children?: ReactNode
}

export function SectionHeading(props: SectionHeadingProps) {
  return (
    <div
      className={cx(
        'mb-5 flex flex-col items-baseline gap-4 lg:flex-row',
        !props.leftAlign && 'justify-between'
      )}
    >
      <h2 className={cx('text-xl font-semibold', props.children && 'flex-1')}>
        {props.title}
      </h2>
      <p className="text-sm font-medium text-zinc-500">{props.description}</p>
      {props.children}
    </div>
  )
}
