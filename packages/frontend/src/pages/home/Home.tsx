import { PedersenHash } from '@explorer/types'
import React from 'react'
import { Page } from '../common'
import { SearchIcon } from '../common/SearchIcon'
import { HomeProps } from './HomeProps'

export function Home(props: HomeProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <form
        method="GET"
        action="/"
        className="rounded-md w-full mt-8 bg-grey-200 flex h-11"
      >
        <input
          className="w-full placeholder:text-grey-400 bg-grey-200 p-4"
          type="text"
          placeholder="Search by hash, Stark key or Ethereum address…"
        />
        <button className="bg-grey-300 w-12 flex items-center justify-center">
          <SearchIcon width={16} height={16} />
        </button>
      </form>
      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-white border-2 border-black p-2">
          <div className="bg-zinc-100 text-center p-2 border border-black">
            Latest state updates
          </div>
          <ul>
            {props.stateUpdates.map((update, i) => (
              <li key={i} className="my-4">
                <a
                  className="w-full grid gap-2 grid-cols-[auto_1fr_auto]"
                  href={`/state-updates/${update.id}`}
                >
                  <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                  <div>
                    <div className="text-blue-700">{update.id}</div>
                    <div>Hash: {formatHash(update.hash)}</div>
                    <div>{update.positionCount} positions</div>
                  </div>
                  <div>{new Date(update.timestamp).toUTCString()}</div>
                </a>
              </li>
            ))}
          </ul>
          <a
            className="block p-2 text-center text-blue-700 bg-zinc-100 border border-black"
            href="/state-updates"
          >
            View all
          </a>
        </div>
      </div>
    </Page>
  )
}

function formatHash(hash: PedersenHash | string) {
  let formatted = hash.toString()
  if (!formatted.startsWith('0x')) {
    formatted = '0x' + formatted
  }
  return `${formatted.slice(0, 10)}…${formatted.slice(-8)}`
}
