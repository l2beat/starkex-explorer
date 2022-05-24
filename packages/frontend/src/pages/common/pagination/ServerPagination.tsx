import React from 'react'

import { NextIcon } from '../icons/NextIcon'
import { PrevIcon } from '../icons/PrevIcon'
import { styles } from './styles'

export interface ServerPaginationProps {
  page: number
  perPage: number
  total: number
  baseUrl?: string
}

export function ServerPagination({
  page,
  perPage,
  total,
  baseUrl = '/',
}: ServerPaginationProps) {
  const last = Math.ceil(total / perPage)

  const link = (page: number, perPage: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    })
    return `${baseUrl}?${params}`
  }

  return (
    <div className={styles.outerWrapper}>
      <div className={styles.innerWrapper}>
        {page === 1 ? (
          <>
            <span className={styles.textButtonInactive}>First</span>
            <span className={styles.arrowButtonInactive}>
              <PrevIcon width={8} height={12} />
            </span>
          </>
        ) : (
          <>
            <a href={link(1, perPage)} className={styles.textButtonActive}>
              First
            </a>
            <a
              href={link(page - 1, perPage)}
              className={styles.arrowButtonActive}
            >
              <PrevIcon width={8} height={12} />
            </a>
          </>
        )}
        <span className={styles.pagesText}>
          Page {page} out of {last}
        </span>
        {page === last ? (
          <>
            <span className={styles.arrowButtonInactive}>
              <NextIcon width={8} height={12} />
            </span>
            <span className={styles.textButtonInactive}>Last</span>
          </>
        ) : (
          <>
            <a
              href={link(page + 1, perPage)}
              className={styles.arrowButtonActive}
            >
              <NextIcon width={8} height={12} />
            </a>
            <a href={link(last, perPage)} className={styles.textButtonActive}>
              Last
            </a>
          </>
        )}
      </div>
      <form action={baseUrl} method="get" className={styles.innerWrapper}>
        <label htmlFor="perPage">Per page</label>
        <select
          name="perPage"
          id="perPage"
          className={styles.textButtonActive}
          autoComplete="off"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} selected={n === perPage}>
              {n}
            </option>
          ))}
        </select>
      </form>
    </div>
  )
}
