import cx from 'classnames'
import React from 'react'

import { PaginationLeftIcon } from '../../assets/icons/PaginationLeftIcon'
import { PaginationRightIcon } from '../../assets/icons/PaginationRightIcon'

export interface TablePaginationProps {
  limit: number
  offset: number
  total: number
  link: string
}

const SURROUNDING_PAGES = 2

export function TablePagination(props: TablePaginationProps) {
  const { previous, current, next, display } = getPages(props)

  const link = (page: number) =>
    `${props.link}?page=${page}&perPage=${props.limit}`

  return (
    <nav>
      <ol className="flex items-center justify-center gap-2 text-sm font-semibold">
        <li>
          {previous ? (
            <a href={link(previous)}>
              <PaginationLeftIcon />
            </a>
          ) : (
            <PaginationLeftIcon className="text-zinc-500" />
          )}
        </li>
        {display.map((page, i) => (
          <li
            key={i}
            className={cx(
              'flex h-6 min-w-[24px] items-center justify-center px-0.5',
              page === current && 'rounded bg-brand'
            )}
          >
            {page ? (
              <a
                className="flex h-full w-full items-center justify-center"
                href={link(page)}
              >
                {page}
              </a>
            ) : (
              <span className="text-zinc-500">…</span>
            )}
          </li>
        ))}
        <li>
          {next ? (
            <a href={link(next)}>
              <PaginationRightIcon />
            </a>
          ) : (
            <PaginationRightIcon className="text-zinc-500" />
          )}
        </li>
      </ol>
    </nav>
  )
}

function getPages(props: { limit: number; offset: number; total: number }) {
  const total = Math.ceil(props.total / props.limit)
  const current = Math.floor(props.offset / props.limit) + 1
  return {
    previous: current - 1 < 1 ? undefined : current - 1,
    current,
    next: current + 1 > total ? undefined : current + 1,
    display: getDisplay(getPageSet(total, current)),
  }
}

function getPageSet(total: number, current: number) {
  const pages = new Set([1, total])

  let startFrom = current - SURROUNDING_PAGES
  if (startFrom > total - SURROUNDING_PAGES * 2 - 2) {
    startFrom = total - SURROUNDING_PAGES * 2 - 2
  }
  let endAt = current + SURROUNDING_PAGES
  if (endAt < SURROUNDING_PAGES * 2 + 3) {
    endAt = SURROUNDING_PAGES * 2 + 3
  }

  for (let i = startFrom; i <= endAt; i++) {
    const page = Math.max(1, Math.min(total, i))
    pages.add(page)
    if (page === 3) pages.add(2)
    if (page === total - 2) pages.add(total - 1)
  }

  return pages
}

function getDisplay(pages: Set<number>) {
  const display: (number | null)[] = []
  const sorted = [...pages].sort((a, b) => a - b)
  for (const [i, page] of sorted.entries()) {
    display.push(page)
    const next = sorted[i + 1]
    if (next !== undefined && next - page > 1) {
      display.push(null)
    }
  }
  return display
}
