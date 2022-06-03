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
  className?: string
}

export interface TableProps {
  id?: string
  hasClientPagination?: boolean
  columns: Column[]
  rows: Row[]
  className?: string
  noRowsText: string
}

export interface ClientPaginatedTableProps {
  id: string
  columns: Column[]
  rows: Row[]
  className?: string
  noRowsText: string
}
