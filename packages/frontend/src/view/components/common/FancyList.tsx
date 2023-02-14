import cx from 'classNames'
import React from 'react'

interface FancyListProps {
  readonly items: React.ReactNode[]
  readonly className?: string
}

export function FancyList({ items, className }: FancyListProps) {
  return (
    <div className={cx('ml-6', className)}>
      {items.map((item, index) => {
        return (
          <div key={index} className="group relative pb-6 pl-4">
            <div className="absolute -left-[13px] mt-2 h-full w-0.5 bg-zinc-500 group-last:hidden " />
            <Index index={index} />
            <span>{item}</span>
          </div>
        )
      })}
    </div>
  )
}

interface IndexProps {
  readonly index: number
  readonly className?: string
}
function Index({ index, className }: IndexProps) {
  return (
    <span
      className={cx(
        'absolute -left-6 h-6 w-6 shrink-0 rounded-lg text-center',
        index === 0 ? 'bg-brand' : 'bg-zinc-500',
        className
      )}
    >
      {index + 1}
    </span>
  )
}
