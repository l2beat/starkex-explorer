import cx from 'classnames'
import React from 'react'

import { TableRow } from './TableRow'
import { Column, Row } from './types'

interface TableProps {
  columns: Column[]
  rows: Row[]
  alignLastColumnRight?: boolean
  shortenOnMobile?: boolean
  rowClassName?: string
}

export function Table(props: TableProps) {
  const { alignLastColumnRight = true } = props
  return (
    <div
      className={cx(
        'overflow-x-auto rounded-lg bg-gray-800 pb-3 group-[.Card]/card:pb-0 sm:w-full'
      )}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        className="w-full whitespace-nowrap"
        style={{ borderSpacing: 0 }}
      >
        <thead>
          <tr className="h-10 text-left text-xs font-semibold uppercase text-zinc-500">
            {props.columns.map((column, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'bg-slate-800 px-2 first:rounded-l first:pl-4 last:rounded-r last:pr-4 sm:px-2.5 sm:first:pl-5 sm:last:pr-5',
                  column.numeric && 'text-right',
                  column.align === 'center' && 'text-center',
                  column.minimalWidth && 'w-0',
                  alignLastColumnRight && 'last:w-0'
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map(({ cells, link }, i) => (
            <TableRow
              cells={cells}
              link={link}
              columns={props.columns}
              className={props.rowClassName}
              shortenOnMobile={props.shortenOnMobile}
              i={i}
              key={i}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
