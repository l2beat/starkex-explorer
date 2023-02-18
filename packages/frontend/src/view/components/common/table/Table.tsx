import cx from 'classnames'
import React from 'react'

import { TableRow } from './TableRow'
import { Column, Row } from './types'

interface TableProps {
  columns: Column[]
  rows: Row[]
}

export function Table(props: TableProps) {
  return (
    <div className={cx('w-full overflow-x-auto')}>
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
                  'bg-gray-800 px-2.5 first:rounded-l first:pl-5 last:rounded-r last:pr-5',
                  column.numeric && 'text-right'
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
              i={i}
              key={i}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
