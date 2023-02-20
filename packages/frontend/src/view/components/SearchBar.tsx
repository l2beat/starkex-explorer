import cx from 'classnames'
import React from 'react'

import { SearchIcon } from '../assets/icons/SearchIcon'

export function SearchBar({ className = '' }) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'group flex h-11 w-full rounded-lg border border-gray-600 bg-transparent drop-shadow-lg focus-within:border-brand hover:border-brand',
        className
      )}
    >
      <input
        className="w-full rounded-l-lg bg-transparent p-4 outline-0 placeholder:text-gray-600 "
        type="text"
        placeholder="Search by Hash, Id, Public Key or Address"
        name="query"
      />
      <button className=" flex w-12 items-center justify-center rounded-r-lg bg-transparent">
        <SearchIcon
          width={20}
          height={20}
          className="fill-gray-600 group-focus-within:fill-white"
        />
      </button>
    </form>
  )
}
