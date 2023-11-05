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
  minimalWidth?: boolean
  className?: string
  // This is a quick hack to exclude the class name from the header
  // There is a problem with HomeStateUpdatesTable where if we add a class name
  // @container/tx-hash to column header, it has some weird side effects
  excludeClassNameFromHeader?: boolean
}
