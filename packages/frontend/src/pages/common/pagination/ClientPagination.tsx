import React from 'react'

import { NextIcon } from '../icons/NextIcon'
import { PrevIcon } from '../icons/PrevIcon'
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
        <button className={styles.textButtonActive}>First</button>
        <button className={styles.arrowButtonActive}>
          <PrevIcon width={8} height={12} />
        </button>
        <span className={styles.pagesText}>Page 1 out of {last}</span>
        <button className={styles.arrowButtonActive}>
          <NextIcon width={8} height={12} />
        </button>
        <button className={styles.textButtonActive}>Last</button>
      </div>
      <label className={styles.innerWrapper}>
        <span>Per page</span>
        <select className={styles.textButtonActive} autoComplete="off">
          {[10, 25, 50, 100].map((n) => (
            <option key={n} selected={n === 10}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
