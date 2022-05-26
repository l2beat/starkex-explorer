import React from 'react'

import { HiddenInputs } from '../HiddenInputs'
import { NextIcon } from '../icons/NextIcon'
import { PrevIcon } from '../icons/PrevIcon'
import { ServerAttributes } from './attributes'
import { styles } from './styles'

export interface ServerPaginationProps {
  page: number
  perPage: number
  total: number
  baseUrl?: string
  additionalParams?: URLSearchParams
}

export function ServerPagination({
  page,
  perPage,
  total,
  baseUrl = '/',
  additionalParams,
}: ServerPaginationProps) {
  const last = Math.ceil(total / perPage)
  const hiddenParams = new URLSearchParams(additionalParams)
  hiddenParams.set(ServerAttributes.PageInputName, page.toString())

  const link = (page: number, perPage: number) => {
    const params = new URLSearchParams(additionalParams)
    params.set(ServerAttributes.PageInputName, page.toString())
    params.set(ServerAttributes.PerPageSelectName, perPage.toString())
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
      <form
        action={baseUrl}
        method="get"
        className={styles.innerWrapper}
        id={ServerAttributes.FormId}
      >
        <label htmlFor="per-page">Per page</label>
        <select
          name={ServerAttributes.PerPageSelectName}
          id="per-page"
          className={styles.textButtonActive}
          autoComplete="off"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} selected={n === perPage}>
              {n}
            </option>
          ))}
        </select>
        {<HiddenInputs params={hiddenParams} />}
      </form>
    </div>
  )
}
