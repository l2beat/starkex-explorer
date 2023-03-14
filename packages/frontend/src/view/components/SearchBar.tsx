import cx from 'classnames'
import React from 'react'

import { SearchIcon } from '../assets/icons/SearchIcon'

interface SearchBarProps {
  tradingMode: 'spot' | 'perpetual'
  className?: string
}

export function SearchBar({ tradingMode, className }: SearchBarProps) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'group flex h-10 w-full rounded-lg border border-gray-600 bg-transparent drop-shadow-lg focus-within:!border-brand hover:border-zinc-500',
        className
      )}
    >
      <input
        className="w-full rounded-l-lg bg-transparent p-4 outline-0 placeholder:text-gray-600 group-focus-within:placeholder:text-zinc-500 group-hover:placeholder:text-zinc-500"
        type="text"
        placeholder={`Search by Ethereum address, Stark key, @state-update-id or #${
          tradingMode === 'perpetual' ? 'position-id' : 'vault-id'
        }`}
        name="query"
      />
      <button className="flex w-12 items-center justify-center rounded-r-lg bg-transparent ">
        <SearchIcon
          width={20}
          height={20}
          className="fill-gray-600 group-focus-within:!fill-white group-hover:fill-zinc-500"
        />
      </button>
    </form>
  )
}
