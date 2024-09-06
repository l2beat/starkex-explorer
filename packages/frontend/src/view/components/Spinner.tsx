import classNames from 'classnames'
import React from 'react'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        'border-current text-surface inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-e-transparent align-[-0.125em] text-white motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white',
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
