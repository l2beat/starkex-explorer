import React from 'react'

import { HiddenInputs } from '../HiddenInputs'
import { ServerFormAttributes } from './attributes'
import { Inside } from './Inside'
import { PageText } from './PageText'
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
  hiddenParams.set(ServerFormAttributes.PageInputName, page.toString())

  const link = (page: number, perPage: number) => {
    const params = new URLSearchParams(additionalParams)
    params.set(ServerFormAttributes.PageInputName, page.toString())
    params.set(ServerFormAttributes.PerPageSelectName, perPage.toString())
    return `${baseUrl}?${params}`
  }

  return (
    <div className={styles.outerWrapper}>
      <div className={styles.innerWrapper}>
        {page === 1 ? (
          <>
            <span className={styles.textButtonInactive}>
              <Inside.FirstPage />
            </span>
            <span className={styles.arrowButtonInactive}>
              <Inside.Previous />
            </span>
          </>
        ) : (
          <>
            <a href={link(1, perPage)} className={styles.textButtonActive}>
              <Inside.FirstPage />
            </a>
            <a
              href={link(page - 1, perPage)}
              className={styles.arrowButtonActive}
            >
              <Inside.Previous />
            </a>
          </>
        )}
        <PageText current={page} total={last} />
        {page === last ? (
          <>
            <span className={styles.arrowButtonInactive}>
              <Inside.Next />
            </span>
            <span className={styles.textButtonInactive}>
              <Inside.LastPage />
            </span>
          </>
        ) : (
          <>
            <a
              href={link(page + 1, perPage)}
              className={styles.arrowButtonActive}
            >
              <Inside.Next />
            </a>
            <a href={link(last, perPage)} className={styles.textButtonActive}>
              <Inside.LastPage />
            </a>
          </>
        )}
      </div>
      <form
        action={baseUrl}
        method="get"
        className={styles.innerWrapper}
        id={ServerFormAttributes.FormId}
      >
        <label htmlFor="per-page">Per page</label>
        <select
          name={ServerFormAttributes.PerPageSelectName}
          id="per-page"
          className={styles.textButtonActive}
          autoComplete="off"
          defaultValue={perPage}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        {<HiddenInputs params={hiddenParams} />}
      </form>
    </div>
  )
}
