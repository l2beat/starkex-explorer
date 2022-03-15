import React from 'react'
import cx from 'classnames'

type PaginationProps = {
  page: number
  perPage: number
  fullCount: number
  baseUrl?: string
}

const PrevIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

const NextIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

export function Pagination({
  page,
  perPage,
  fullCount,
  baseUrl = '/',
}: PaginationProps) {
  const first = 1
  const prev = Number(page) - 1
  const next = Number(page) + 1
  const last = Math.floor(fullCount / perPage) || 1

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
            prev < 1 && 'pointer-events-none bg-grey-400 cursor-not-allowed'
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
