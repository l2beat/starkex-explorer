import React, { ReactNode } from 'react'
import { formatHash } from '../formatHash'
import { formatTime } from '../formatTime'

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
                    {formatTime(update.timestamp)}
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

const PrevIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg
    viewBox="0 0 8 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#a)">
      <path
        d="M7.41 1.91 6 .5l-6 6 6 6 1.41-1.41L2.83 6.5l4.58-4.59Z"
        fill="#FAFAFA"
      />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" transform="translate(0 .5)" d="M0 0h8v12H0z" />
      </clipPath>
    </defs>
  </svg>
)

const NextIcon = (
  props: JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>
) => (
  <svg
    viewBox="0 0 8 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M.59 11.09 2 12.5l6-6-6-6L.59 1.91 5.17 6.5.59 11.09Z"
      fill="#FAFAFA"
    />
  </svg>
)

export function Pagination({ page, perPage, fullCount }: PaginationProps) {
  const first = 1
  const prev = Number(page) - 1
  const next = Number(page) + 1
  const last = Math.floor(fullCount / perPage) || 1

  return (
    <div className="w-full flex justify-between mb-2 leading-5 flex-wrap gap-y-2">
      <div className="gap-x-2 flex items-center flex-wrap gap-y-2">
        <a
          href={stateUpdatesLink(first, perPage)}
          className="bg-grey-300 px-3 py-1 rounded-md"
        >
          First
        </a>
        <a
          href={stateUpdatesLink(prev, perPage)}
          className={
            'bg-grey-300 px-3 py-2 rounded-md' +
            (prev < 1
              ? ' pointer-events-none bg-grey-400 cursor-not-allowed'
              : '')
          }
        >
          <PrevIcon width={8} height={12} />
        </a>
        <span className="bg-grey-200 px-3 py-1 rounded-md">
          Page {page} out of {last}
        </span>
        <a
          href={stateUpdatesLink(next, perPage)}
          className={
            'bg-grey-300 px-3 py-2 rounded-md' +
            (next > last
              ? ' pointer-events-none bg-grey-400 cursor-not-allowed'
              : '')
          }
        >
          <NextIcon width={8} height={12} />
        </a>
        <a
          href={stateUpdatesLink(last, perPage)}
          className="bg-grey-300 px-3 py-1 rounded-md"
        >
          Last
        </a>
      </div>
      <form
        action={stateUpdatesLink(1, perPage)}
        method="get"
        className="pagination flex gap-x-2 items-center"
      >
        <label htmlFor="perPage">Per page</label>
        <select name="perPage" className="bg-grey-300 rounded-md px-3 py-0.5">
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
