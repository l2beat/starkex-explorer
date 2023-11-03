import { TradingMode } from '@explorer/shared'
import { default as classNames, default as cx } from 'classnames'
import React from 'react'

import { SearchIcon } from '../assets/icons/SearchIcon'

interface SearchBarProps {
  tradingMode: TradingMode
  className?: string
  expandable?: boolean
}

export function SearchBar({
  tradingMode,
  className,
  expandable,
}: SearchBarProps) {
  return (
    <form
      method="GET"
      action="/search"
      className={cx(
        'SearchBar group flex h-10 w-full rounded-lg border border-gray-600 bg-black drop-shadow-lg transition-colors focus-within:!border-brand hover:border-zinc-500',
        expandable && 'Expandable relative',
        className
      )}
    >
      <input
        className={classNames(
          'rounded-l-lg bg-transparent p-4 outline-0 placeholder:text-gray-600 group-focus-within:placeholder:text-zinc-500 group-hover:placeholder:text-zinc-500',
          expandable && 'w-10 cursor-pointer transition-[width]',
          !expandable && 'w-full'
        )}
        type="text"
        placeholder={`ETH address, Stark key, @state-update-id or #${
          tradingMode === 'perpetual' ? 'position-id' : 'vault-id'
        }`}
        // do not show 1Password on this input
        data-1p-ignore
        name="query"
      />
      <button
        className={classNames(
          'z-10 flex w-10 items-center justify-center rounded-lg bg-black',
          expandable && 'absolute inset-y-0 right-0'
        )}
      >
        <SearchIcon
          width={20}
          height={20}
          className="fill-gray-600 group-focus-within:!fill-white group-hover:fill-zinc-500"
        />
      </button>
    </form>
  )
}
