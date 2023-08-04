import { TradingMode } from '@explorer/shared'
import { default as classNames, default as cx } from 'classnames'
import React from 'react'

import { SearchIcon } from '../assets/icons/SearchIcon'

interface SearchBarProps {
  tradingMode: TradingMode
  expandable?: boolean
  className?: string
}

export function SearchBar({
  tradingMode,
  expandable = false,
  className,
}: SearchBarProps) {
  const placeholder = `ETH address, Stark key, @state-update-id or #${
    tradingMode === 'perpetual' ? 'position-id' : 'vault-id'
  }`

  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'group relative flex h-10 rounded-lg border border-gray-600 bg-transparent drop-shadow-lg transition-colors focus-within:!border-brand hover:border-zinc-500',
        className
      )}
    >
      <input
        className={classNames(
          'rounded-l-lg bg-transparent outline-0 transition-[width] placeholder:text-gray-600 group-hover:placeholder:text-zinc-500',
          expandable &&
            'w-12 cursor-pointer py-0 pl-0 opacity-0 group-focus-within:mr-12 group-focus-within:w-40 group-focus-within:cursor-text group-focus-within:py-4 group-focus-within:pl-4 group-focus-within:opacity-100 group-focus-within:placeholder:text-zinc-500',
          !expandable && 'mr-12 w-full py-4 pl-4'
        )}
        type="text"
        placeholder={expandable ? undefined : placeholder}
        // do not show 1Password on this input
        data-1p-ignore
        name="query"
      />
      <button
        className={classNames(
          'absolute inset-y-auto right-0 flex h-10 w-12 items-center justify-center rounded-r-lg bg-transparent',
          expandable &&
            'pointer-events-none group-focus-within:pointer-events-auto'
        )}
      >
        <SearchIcon
          width={20}
          height={20}
          className="fill-gray-600 transition-[fill] group-focus-within:!fill-white group-hover:fill-zinc-500"
        />
      </button>
    </form>
  )
}
