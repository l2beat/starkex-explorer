import { isNumber } from 'lodash'
import React, { ReactNode } from 'react'

import { formatInt } from '../../../utils/formatting/formatAmount'
import { SectionHeading } from '../SectionHeading'
import { TableLimitSelect } from './TableLimitSelect'
import { TablePagination } from './TablePagination'

interface TableWithPaginationProps {
  title: ReactNode
  path: string
  entryShortNamePlural: string
  entryLongNamePlural: string
  visible: number
  limit: number
  offset: number
  total: number | 'processing'
  children: ReactNode
}

export function TableWithPagination(props: TableWithPaginationProps) {
  const currentPage = Math.floor(props.offset / props.limit) + 1
  const totalPages = isNumber(props.total)
    ? Math.ceil(props.total / props.limit)
    : undefined

  return (
    <>
      <SectionHeading
        title={props.title}
        description={getDescription(
          props.offset,
          props.visible,
          props.total,
          props.entryShortNamePlural
        )}
      >
        <TableLimitSelect limit={props.limit} link={props.path} />
      </SectionHeading>
      {props.children}
      {props.visible === 0 && (
        <div className="flex h-10 items-center justify-center text-center text-md text-zinc-500">
          There are no {props.entryLongNamePlural} to view.
        </div>
      )}
      {totalPages && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex-1">
            <TablePagination
              className="hidden sm:block"
              surroundingPages={2}
              link={props.path}
              current={currentPage}
              total={totalPages}
              perPage={props.limit}
            />
            <TablePagination
              className="sm:hidden"
              surroundingPages={1}
              link={props.path}
              current={currentPage}
              total={totalPages}
              perPage={props.limit}
            />
          </div>
          <TableLimitSelect limit={props.limit} link={props.path} />
        </div>
      )}
    </>
  )
}

function getDescription(
  offset: number,
  visible: number,
  total: number | 'processing',
  entryShortNamePlural: string
) {
  if (total === 'processing') {
    return `${entryShortNamePlural} are being processed...`
  }

  const start = formatInt(1 + offset)
  const end = formatInt(offset + visible)
  const formattedTotal = formatInt(total)

  return visible !== 0 ? (
    <>
      You're viewing {start}-{end} out of {formattedTotal}{' '}
      {entryShortNamePlural}
    </>
  ) : (
    <>
      You're viewing 0 out of {formattedTotal} {entryShortNamePlural}
    </>
  )
}
