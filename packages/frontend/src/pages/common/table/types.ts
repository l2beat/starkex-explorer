import { ReactNode } from 'react'

export interface Row {
  cells: ReactNode[]
  link?: string
}

export interface Column {
  header: string
  numeric?: boolean
  monospace?: boolean
  fullWidth?: boolean
  textAlignClass?: 'text-left' | 'text-right'
}

export interface TableProps {
  columns: Column[]
  rows: Row[]
  className?: string
  noRowsText: string
}
