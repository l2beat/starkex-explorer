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
}

export interface TableProps {
  id?: string
  hasClientPagination?: boolean
  columns: Column[]
  rows: Row[]
  className?: string
  noRowsText: string
}
