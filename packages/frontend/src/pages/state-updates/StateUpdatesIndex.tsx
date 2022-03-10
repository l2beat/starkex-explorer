import React, { ReactNode } from 'react'
import { formatHash } from '../formatHash'
import { format as timeAgo } from 'timeago.js'

import { Page } from '../common'
import { StateUpdatesIndexProps } from './StateUpdatesIndexProps'

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

export function StateUpdatesIndex({
  stateUpdates,
  params: { perPage, page },
  fullCount,
}: StateUpdatesIndexProps) {
  return (
    <Page
      title="L2BEAT dYdX Explorer"
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Latest state updates
      </h1>
      <Pagination perPage={perPage} page={page} fullCount={fullCount} />
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr className="bg-grey-300 font-medium">
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
            {stateUpdates.map((update, i) => (
              <tr
                key={i}
                className={`my-4 hover:bg-blue-100 ${
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                }`}
              >
                <td className="px-2 py-0.5 font-mono">
                  <StateUpdateLink id={update.id}>{update.id}</StateUpdateLink>
                </td>
                <td className="max-w-[320px] px-2 py-0.5 font-mono">
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
                <td className="text-right px-2 py-0.5 font-mono">
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

const stateUpdatesLink = (page: number, perPage: number) =>
  `/state-updates?page=${page}&perPage=${perPage}`

type PaginationProps = {
  page: number
  perPage: number
  fullCount: number
}

function Pagination({ page, perPage, fullCount }: PaginationProps) {
  const first = 1
  const prev = page - 1
  const next = page + 1
  const last = Math.floor(fullCount / perPage) || 1

  return (
    <div>
      <a href={stateUpdatesLink(first, perPage)}>First</a>
      {prev >= 1 && <a href={stateUpdatesLink(prev, perPage)}>Prev</a>}
      <span>
        Page {page} out of {last}
      </span>
      {next <= last && <a href={stateUpdatesLink(next, perPage)}>Next</a>}
      <a href={stateUpdatesLink(last, perPage)}>Last</a>
      <form
        action={stateUpdatesLink(1, perPage)}
        method="get"
        className="pagination"
      >
        <label htmlFor="perPage">Per page</label>
        <select name="perPage" className="bg-grey-100">
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n} selected={n == perPage}>
              {n}
            </option>
          ))}
        </select>
      </form>
      <script
        dangerouslySetInnerHTML={{
          __html: `
      document.querySelector('form.pagination select[name="perPage"]').onchange = function () { this.form.submit() }
      `,
        }}
      ></script>
    </div>
  )
}
