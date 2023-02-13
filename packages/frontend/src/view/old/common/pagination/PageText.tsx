import React from 'react'

import { styles } from './styles'

export interface PageTextProps {
  current: number
  total: number
}

export function PageText({ current, total }: PageTextProps) {
  return (
    <span className={styles.pagesText}>
      <span className="wide:inline hidden">Page </span>
      <span data-current>{current}</span>
      <span className="wide:inline hidden"> out</span>
      {' of '}
      <span data-total>{total}</span>
    </span>
  )
}
