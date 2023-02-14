import cx from 'classNames'
import React from 'react'

interface FancyListProps {
  readonly items: React.ReactNode[]
  readonly className?: string
}

export function FancyList({ items, className }: FancyListProps) {
  return (
    <div className={cx('h-auto', className)}>
      <div className="ml-6">
        {items.map((item, index) => {
          return (
            <div key={index} className="group relative pb-6 pl-4">
              <div className="absolute -left-[13px] mt-2 h-[100%] group-last:hidden">
                <div className="h-full w-[2px] bg-zinc-500 " />
              </div>
              <Index index={index} className="absolute -left-6" />

              <span>{item}</span>
            </div>
          )
        })}
      </div>
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
        'h-[24px] w-[24px] shrink-0 rounded-lg text-center',
        index === 0 ? 'bg-brand' : 'bg-zinc-500',
        className
      )}
    >
      {index + 1}
    </span>
  )
}
