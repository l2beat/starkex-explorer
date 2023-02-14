import cx from 'classnames'
import React from 'react'
import { SearchIcon } from './icons/SearchIcon'

export function SearchBar({ className = '' }) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'bg-transparent border-grey-500 flex h-11 w-full rounded-lg border drop-shadow-lg',
        className
      )}
    >
      <input
        className="bg-black placeholder:text-grey-500 w-full rounded-l-lg p-4 outline-0"
        type="text"
        placeholder="Search by Hash, Id, Public Key or Address"
        name="query"
      />
      <button className="bg-transparent flex w-12 items-center justify-center rounded-r-lg">
        <SearchIcon width={20} height={20} className="fill-grey-500" />
      </button>
    </form>
  )
}
