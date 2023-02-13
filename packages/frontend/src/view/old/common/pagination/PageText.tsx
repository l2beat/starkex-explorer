import React from 'react'

import { styles } from './styles'

export interface PageTextProps {
  current: number
  total: number
}

export function PageText({ current, total }: PageTextProps) {
  return (
    <span className={styles.pagesText}>
      <span className="hidden wide:inline">Page </span>
      <span data-current>{current}</span>
      <span className="hidden wide:inline"> out</span>
      {' of '}
      <span data-total>{total}</span>
    </span>
  )
}
