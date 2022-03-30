import React from 'react'
import cx from 'classnames'
import { NextIcon } from './icons/NextIcon'
import { PrevIcon } from './icons/PrevIcon'

type PaginationProps = {
  page: number
  perPage: number
  fullCount: number
  baseUrl?: string
}

export function Pagination({
  page,
  perPage,
  fullCount,
  baseUrl = '/',
}: PaginationProps) {
  const first = 1
  const prev = Number(page) - 1
  const next = Number(page) + 1
  const last = Math.ceil(fullCount / perPage)

  const link = (page: number, perPage: number) => {
    const hasQuestionMark = baseUrl.indexOf('?') !== -1
    return (
      baseUrl + (hasQuestionMark ? '' : '?') + `page=${page}&perPage=${perPage}`
    )
  }

  return (
    <div className="w-full flex justify-between mb-2 leading-5 flex-wrap gap-y-2">
      <div className="gap-x-2 flex items-center flex-wrap gap-y-2">
        <a
          href={link(first, perPage)}
          className="bg-grey-300 px-3 py-1 rounded-md"
        >
          First
        </a>
        <a
          href={link(prev, perPage)}
          className={cx(
            'bg-grey-300 px-3 py-2 rounded-md',
            prev < first && 'pointer-events-none bg-grey-400 cursor-not-allowed'
          )}
        >
          <PrevIcon width={8} height={12} />
        </a>
        <span className="bg-grey-200 px-3 py-1 rounded-md">
          Page {page} out of {last}
        </span>
        <a
          href={link(next, perPage)}
          className={cx(
            'bg-grey-300 px-3 py-2 rounded-md',
            next > last && 'pointer-events-none bg-grey-400 cursor-not-allowed'
          )}
        >
          <NextIcon width={8} height={12} />
        </a>
        <a
          href={link(last, perPage)}
          className="bg-grey-300 px-3 py-1 rounded-md"
        >
          Last
        </a>
      </div>
      <form
        action={link(1, perPage)}
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
