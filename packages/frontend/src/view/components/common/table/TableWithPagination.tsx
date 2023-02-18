import React, { ReactNode } from 'react'
import { formatInt } from '../../../../utils/formatting/formatAmount'

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
  const start = formatInt(1 + props.offset)
  const end = formatInt(props.offset + props.visible)
  const total = formatInt(props.total)
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold">{props.title}</h1>
        <p className="text-sm font-medium text-zinc-500">
          {props.visible !== 0 ? (
            <>
              You are viewing {start}-{end} out of {total}{' '}
              {props.entryShortNamePlural}
            </>
          ) : (
            <>
              You are viewing 0 out of {total} {props.entryShortNamePlural}
            </>
          )}
        </p>
      </div>
      {props.children}
      {props.visible === 0 && (
        <div className="flex h-10 items-center justify-center text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
    </section>
  )
}
