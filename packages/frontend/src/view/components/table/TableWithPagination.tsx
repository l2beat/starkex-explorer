import React, { ReactNode } from 'react'

import { formatInt } from '../../../utils/formatting/formatAmount'
import { TableLimitSelect } from './TableLimitSelect'
import { TablePagination } from './TablePagination'

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

  const currentPage = Math.floor(props.offset / props.limit) + 1
  const totalPages = Math.ceil(props.total / props.limit)

  return (
    <>
      <div className="mb-5 flex flex-col items-baseline justify-between gap-4 lg:flex-row">
        <h1 className="flex-1 text-xl font-semibold">{props.title}</h1>
        <p className="text-sm font-medium text-zinc-500">
          {props.visible !== 0 ? (
            <>
              You're viewing {start}-{end} out of {total}{' '}
              {props.entryShortNamePlural}
            </>
          ) : (
            <>
              You're viewing 0 out of {total} {props.entryShortNamePlural}
            </>
          )}
        </p>
        <TableLimitSelect
          currentPage={currentPage}
          limit={props.limit}
          link={props.link}
        />
      </div>
      {props.children}
      {props.visible === 0 && (
        <div className="flex h-10 items-center justify-center text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
      <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex-1">
          <TablePagination
            className="hidden sm:block"
            surroundingPages={2}
            link={props.link}
            current={currentPage}
            total={totalPages}
            perPage={props.limit}
          />
          <TablePagination
            className="sm:hidden"
            surroundingPages={1}
            link={props.link}
            current={currentPage}
            total={totalPages}
            perPage={props.limit}
          />
        </div>
        <TableLimitSelect
          currentPage={currentPage}
          limit={props.limit}
          link={props.link}
        />
      </div>
    </>
  )
}
