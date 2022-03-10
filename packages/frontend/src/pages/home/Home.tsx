import { PedersenHash } from '@explorer/types'
import React, { ReactNode } from 'react'
import { Page } from '../common'
import { SearchBar } from '../common/SearchBar'
import { HomeProps } from './HomeProps'
import { format as timeAgo } from 'timeago.js'

const StateUpdateLink = ({
  id,
  children,
  className,
}: {
  id: number
  children: ReactNode
  className?: string
}) => (
  <a href={`/state-updates/${id}`} className={`block ${className}`}>
    {children}
  </a>
)

export function Home(props: HomeProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      navbarSearch={false}
    >
      <SearchBar className="drop-shadow-lg my-12" />
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <caption className="mb-1.5">
            <span className="float-left">Latest state updates</span>
            <a
              className="text-blue-200 underline float-right"
              href="/state-updates"
            >
              view all
            </a>
          </caption>
          <thead>
            <tr className="bg-grey-300">
              <th
                scope="col"
                className="text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                No.
              </th>
              <th
                scope="col"
                className="max-w-[320px] text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Hash
              </th>
              <th
                scope="col"
                className="text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Time
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Position updates
              </th>
            </tr>
          </thead>
          <tbody>
            {props.stateUpdates.map((update, i) => (
              <tr
                key={i}
                className={`my-4 hover:bg-blue-100 ${
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                }`}
              >
                <td className="px-2 py-0.5">
                  <StateUpdateLink id={update.id}>{update.id}</StateUpdateLink>
                </td>
                <td className="max-w-[320px] px-2 py-0.5">
                  <a
                    href={`/state-updates/${update.id}`}
                    className="block text-ellipsis overflow-hidden"
                  >
                    {formatHash(update.hash)}
                  </a>
                </td>
                <td className="px-2 py-0.5">
                  <StateUpdateLink id={update.id}>
                    {timeAgo(update.timestamp)}
                  </StateUpdateLink>
                </td>
                <td className="text-right px-2 py-0.5">
                  <StateUpdateLink id={update.id}>
                    {update.positionCount}
                  </StateUpdateLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  )
}

function formatHash(hash: PedersenHash | string) {
  let formatted = hash.toString()
  if (!formatted.startsWith('0x')) {
    formatted = '0x' + formatted
  }
  return formatted
}
