import React, { ComponentPropsWithoutRef } from 'react'

import { Page } from '../common'
import { Footer } from '../common/Footer'
import { Navbar } from '../common/Navbar'
import { StateChangesIndexProps } from './StateChangesIndexProps'

export function StateChangesIndex({
  stateUpdates,
  params,
  fullCount,
}: StateChangesIndexProps) {
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
        <div className="bg-white border-2 border-black p-2">
          <ul>
            {stateUpdates.map((update, i) => (
              <li key={i} className="my-4">
                <a
                  className="w-full grid gap-2 grid-cols-[auto_1fr_auto]"
                  href={`/state-updates/${update.hash}`}
                >
                  <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                  <div>
                    <div className="text-blue-700">{update.hash}</div>
                    <div>{update.positionCount} positions</div>
                  </div>
                  <div>{new Date(update.timestamp).toUTCString()}</div>
                </a>
              </li>
            ))}
          </ul>
          <Pagination
            perPage={params.perPage}
            page={params.page}
            pageCount={Math.ceil(fullCount / params.perPage)}
          />
        </div>
        <Footer />
      </main>
    </Page>
  )
}

interface PaginationProps {
  perPage: number
  page: number
  pageCount: number
}

function Pagination({ page, pageCount, perPage: _perPage }: PaginationProps) {
  const aroundCurrentPage = [
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ].filter((x) => x > 2 && x < pageCount - 1)

  return (
    <nav className="border-t border-zinc-200 px-4 flex items-center justify-between sm:px-0 pb-2">
      <div className="-mt-px w-0 flex-1 flex">
        <a
          href="#"
          className="border-t-2 border-transparent pt-4 pr-1 inline-flex items-center font-medium text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
        >
          <ArrowLeftIcon
            className="mr-3 h-5 w-5 text-zinc-400"
            aria-hidden="true"
          />
          Previous
        </a>
      </div>
      <div className="hidden md:-mt-px md:flex">
        <PageLink page={1} isCurrent={page === 1} />
        <PageLink page={2} isCurrent={page === 2} />
        {page > 5 && <PaginationEllipsis />}
        {aroundCurrentPage.map((num) => (
          <PageLink key={num} page={num} isCurrent={page === num} />
        ))}
        {page < pageCount - 4 && <PaginationEllipsis />}
        {pageCount > 4 && (
          <PageLink page={pageCount - 1} isCurrent={page === pageCount - 1} />
        )}
        {pageCount > 5 && (
          <PageLink page={pageCount} isCurrent={page === pageCount} />
        )}
      </div>
      <div className="-mt-px w-0 flex-1 flex justify-end">
        <a
          href="#"
          className="border-t-2 border-transparent pt-4 pl-1 inline-flex items-center font-medium text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
        >
          Next
          <ArrowNarrowRightIcon
            className="ml-3 h-5 w-5 text-zinc-400"
            aria-hidden="true"
          />
        </a>
      </div>
    </nav>
  )
}

function PaginationEllipsis() {
  return (
    <span className="border-transparent text-zinc-500 border-t-2 pt-4 px-4 inline-flex items-center font-medium">
      ...
    </span>
  )
}

function PageLink({ isCurrent, page }: { isCurrent: boolean; page: number }) {
  return (
    <a
      href="#"
      className={`
        border-t-2 pt-4 px-4 inline-flex items-center font-medium
        ${
          isCurrent
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
        }
      `}
      aria-current={isCurrent ? 'page' : undefined}
    >
      {page}
    </a>
  )
}

type IconProps = Omit<ComponentPropsWithoutRef<'svg'>, 'children'>

function ArrowLeftIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16l-4-4m0 0l4-4m-4 4h18"
      />
    </svg>
  )
}

export function ArrowNarrowRightIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  )
}
