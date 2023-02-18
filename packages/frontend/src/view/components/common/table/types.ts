import { ReactNode } from 'react'

export interface Row {
  cells: ReactNode[]
  link?: string
}

export interface Column {
  header: string
  numeric?: boolean
  monospace?: boolean
  className?: string
}
