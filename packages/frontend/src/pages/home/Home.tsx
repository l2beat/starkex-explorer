import { PedersenHash } from '@explorer/types'
import React from 'react'
import { Page } from '../common'
import { Footer } from '../common/Footer'
import { Navbar } from '../common/Navbar'
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
      <main className="px-4 max-w-5xl mx-auto">
        <Navbar />
        <input
          className="w-full p-4 mt-8 border-2 border-black placeholder:text-zinc-600"
          type="text"
          placeholder="Search by hash, Stark key or Ethereum address…"
        />
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
                    href={`/state-updates/${update.hash}`}
                  >
                    <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                    <div>
                      <div className="text-blue-700">
                        {formatHash(update.hash)}
                      </div>
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
          <div className="bg-white border-2 border-black p-2">
            <div className="bg-zinc-100 text-center p-2 border border-black">
              Latest forced transactions
            </div>
            <ul>
              {props.forcedTransaction.map((tx, i) => (
                <li key={i} className="my-4">
                  <a
                    className="w-full grid gap-2 grid-cols-[auto_1fr_auto]"
                    href={`/forced-transactions/${tx.hash}`}
                  >
                    <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                    <div>
                      <div className="text-blue-700">{formatHash(tx.hash)}</div>
                      <div>
                        {tx.type} ({tx.valueUSDCents / 100} USD)
                      </div>
                    </div>
                    <div>{new Date(tx.timestamp).toUTCString()}</div>
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="block p-2 text-center text-blue-700 bg-zinc-100 border border-black"
              href="/forced-transactions"
            >
              View all
            </a>
          </div>
        </div>
        <Footer />
      </main>
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
