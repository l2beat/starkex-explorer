import { AssetId } from '@explorer/types'
import React from 'react'

import { FormId } from '../../transaction-form/ids'
import { AssetIcon } from '../icons/AssetIcon'
import { NextIcon } from '../icons/NextIcon'
import { PrevIcon } from '../icons/PrevIcon'
import { styles } from './styles'

function AssetSelect({
  assetId,
  assetIds = [],
}: {
  assetId?: AssetId
  assetIds?: AssetId[]
}) {
  return (
    <div>
      {assetId ? (
        <>
          <AssetIcon
            id={FormId.AssetIconView}
            className="w-4 h-4"
            assetId={assetId}
          />
          <span>{AssetId.symbol(assetId)}</span>
        </>
      ) : (
        'All assets'
      )}
      <svg viewBox="0 0 10 5" width="10" height="5" className="fill-white">
        <path d="M0 0L10 0L5 5D" />
      </svg>
      <select
        id="assetId"
        name="assetId"
        className="w-full h-full opacity-0 bg-white appearance-none cursor-pointer"
      >
        {assetIds.map((id) => (
          <option
            key={id.toString()}
            value={id.toString()}
            selected={id === assetId}
          >
            {AssetId.symbol(id)}
          </option>
        ))}
        <option key="all" value="" selected={!assetId}>
          All assets
        </option>
      </select>
    </div>
  )
}

export interface ServerPaginationProps {
  page: number
  perPage: number
  total: number
  baseUrl?: string
  assetId?: AssetId
  assetIds?: AssetId[]
}

export function ServerPagination({
  page,
  perPage,
  total,
  assetId,
  assetIds,
  baseUrl = '/',
}: ServerPaginationProps) {
  const last = Math.ceil(total / perPage)

  const link = (page: number, perPage: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    })
    if (assetId) {
      params.append('assetId', assetId.toString())
    }
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
        id="serverPagination"
      >
        <AssetSelect assetId={assetId} assetIds={assetIds} />

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
