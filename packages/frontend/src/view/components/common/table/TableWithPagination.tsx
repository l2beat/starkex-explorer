import React, { ReactNode } from 'react'

export interface TableWithPaginationProps {
  title: ReactNode
  link: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  limit: number
  offset: number
  total: number
  children: ReactNode
}

export function TableWithPagination(props: TableWithPaginationProps) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{props.title}</h1>
        <p className="text-sm font-medium text-zinc-500">
          You are viewing {1 + props.offset}-{props.offset + props.visible} out
          of {props.total} {props.entryShortNamePlural}
        </p>
      </div>
      {props.children}
    </section>
  )
}
