import React from 'react'

import { Inside } from './Inside'
import { PageText } from './PageText'
import { styles } from './styles'

export interface ClientPaginationProps {
  total: number
  tableId: string
}

export function ClientPagination({ total, tableId }: ClientPaginationProps) {
  const last = Math.ceil(total / 10)

  return (
    <div data-paginates={tableId} className={styles.outerWrapper}>
      <div className={styles.innerWrapper}>
        <button className={styles.textButtonActive}>
          <Inside.FirstPage />
        </button>
        <button className={styles.arrowButtonActive}>
          <Inside.Previous />
        </button>
        <PageText current={1} total={last} />
        <button className={styles.arrowButtonActive}>
          <Inside.Next />
        </button>
        <button className={styles.textButtonActive}>
          <Inside.LastPage />
        </button>
      </div>
      <label className={styles.innerWrapper}>
        <span>Per page</span>
        <select
          className={styles.textButtonActive}
          autoComplete="off"
          defaultValue={10}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
    </div>
  )
}
