import cx from 'classnames'
import React from 'react'

import { ArrowLeftIcon, ArrowRightIcon } from '../../assets/icons/ArrowIcon'

export interface TablePaginationProps {
  surroundingPages: number
  className?: string
  link: string
  current: number
  total: number
  perPage: number
}

export function TablePagination(props: TablePaginationProps) {
  const { previous, next, display } = getPages(
    props.current,
    props.total,
    props.surroundingPages
  )

  const link = (page: number) =>
    `${props.link}?page=${page}&perPage=${props.perPage}`

  return (
    <nav className={props.className}>
      <ol className="flex items-center justify-center gap-2 text-sm font-semibold">
        <li>
          {previous ? (
            <a href={link(previous)}>
              <ArrowLeftIcon />
            </a>
          ) : (
            <ArrowLeftIcon className="text-zinc-500" />
          )}
        </li>
        {display.map((page, i) => (
          <li
            key={i}
            className={cx(
              'flex h-6 min-w-[24px] items-center justify-center px-0.5',
              page === props.current && 'rounded bg-brand'
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
              <ArrowRightIcon />
            </a>
          ) : (
            <ArrowRightIcon className="text-zinc-500" />
          )}
        </li>
      </ol>
    </nav>
  )
}

function getPages(current: number, total: number, surroundingPages: number) {
  return {
    previous: current - 1 < 1 ? undefined : current - 1,
    next: current + 1 > total ? undefined : current + 1,
    display: getDisplay(getPageSet(current, total, surroundingPages)),
  }
}

function getPageSet(current: number, total: number, surroundingPages: number) {
  const pages = new Set([1, total])

  let startFrom = current - surroundingPages
  if (startFrom > total - surroundingPages * 2 - 2) {
    startFrom = total - surroundingPages * 2 - 2
  }
  let endAt = current + surroundingPages
  if (endAt < surroundingPages * 2 + 3) {
    endAt = surroundingPages * 2 + 3
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
