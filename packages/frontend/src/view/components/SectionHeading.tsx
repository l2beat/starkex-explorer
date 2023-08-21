import { default as classNames, default as cx } from 'classnames'
import React, { ReactNode } from 'react'

interface SectionHeadingProps {
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  className?: string
}

export function SectionHeading(props: SectionHeadingProps) {
  return (
    <div
      className={classNames(
        'mb-5 flex flex-wrap items-baseline justify-between gap-4',
        props.className
      )}
    >
      <h2
        className={cx(
          'text-xl font-semibold leading-tight',
          props.children && 'flex-1'
        )}
      >
        {props.title}
      </h2>
      {props.description && (
        <p className="text-sm font-medium text-zinc-500">{props.description}</p>
      )}
      {props.children}
    </div>
  )
}
