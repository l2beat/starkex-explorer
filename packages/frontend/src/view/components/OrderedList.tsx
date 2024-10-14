import cx from 'classnames'
import React from 'react'

interface FancyListProps {
  readonly items: React.ReactNode[]
  readonly className?: string
}

export function OrderedList({ items, className }: FancyListProps) {
  return (
    <ol className={cx('ml-6', className)}>
      {items.map((item, index) => {
        return (
          <li key={index} className="group relative pb-6 pl-4 last:pb-0">
            <div className="absolute -left-[13px] mt-2 h-full w-0.5 bg-zinc-500 group-last:hidden" />
            <Index index={index} />
            <span>{item}</span>
          </li>
        )
      })}
    </ol>
  )
}

interface IndexProps {
  readonly index: number
}
function Index({ index }: IndexProps) {
  return (
    <span className="absolute -left-6 h-6 w-6 shrink-0 rounded-lg group-first:bg-brand bg-zinc-500 text-center">
      {index + 1}
    </span>
  )
}
