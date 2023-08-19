import { default as classNames, default as cx } from 'classnames'
import React, { ReactNode } from 'react'

interface SectionHeadingProps {
  title: ReactNode
  className?: string
  description?: ReactNode
  children?: ReactNode
}

export function SectionHeading(props: SectionHeadingProps) {
  return (
    <div
      className={classNames(
        'mb-5 flex flex-wrap items-baseline justify-between gap-4',
        props.className
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
