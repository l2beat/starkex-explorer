import { ReactNode } from 'react'

export interface Row {
  cells: ReactNode[]
  link?: string
}

export interface Column {
  header: ReactNode
  numeric?: boolean
  monospace?: boolean
  align?: 'center'
  className?: string
}
