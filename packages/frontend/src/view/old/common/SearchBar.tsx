import cx from 'classnames'
import React from 'react'

import { SearchIcon } from './icons/SearchIcon'

export function SearchBar({ className = '' }) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'flex h-11 w-full rounded-md bg-grey-200 drop-shadow-lg',
        className
      )}
    >
      <input
        className="w-full rounded-l-md bg-grey-200 p-4 outline-0 placeholder:text-grey-400"
        type="text"
        placeholder="Search by hash, Stark key or Ethereum address…"
        name="query"
      />
      <button className="flex w-12 items-center justify-center rounded-r-md bg-grey-300">
        <SearchIcon width={16} height={16} />
      </button>
    </form>
  )
}
