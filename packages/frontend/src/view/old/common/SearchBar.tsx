import cx from 'classnames'
import React from 'react'

import { SearchIcon } from './icons/SearchIcon'

export function SearchBar({ className = '' }) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'bg-gray-200 flex h-11 w-full rounded-md drop-shadow-lg',
        className
      )}
    >
      <input
        className="bg-gray-200 placeholder:text-gray-400 w-full rounded-l-md p-4 outline-0"
        type="text"
        placeholder="Search by hash, Stark key or Ethereum address…"
        name="query"
      />
      <button className="bg-gray-300 flex w-12 items-center justify-center rounded-r-md">
        <SearchIcon width={16} height={16} />
      </button>
    </form>
  )
}
