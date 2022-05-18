import cx from 'classnames'
import React from 'react'

import { NoRowsMessage } from './NoRowsMessage'
import { TableRow } from './TableRow'
import { TableProps } from './types'

export function Table({ columns, rows, className, noRowsText }: TableProps) {
  return (
    <div className={cx('overflow-x-auto w-full', className)}>
      <table className="w-full whitespace-nowrap">
        <thead>
          <tr className="bg-grey-100 font-medium">
            {columns.map(({ header, numeric, fullWidth }, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'p-px pb-0.5 first:pl-0 last:pr-0',
                  numeric ? 'text-right' : 'text-left',
                  !fullWidth && 'w-0'
                )}
              >
                <div className="px-1.5 py0.5 bg-grey-300 rounded-[3px]">
                  {header}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map(({ cells, link }, i) => (
              <TableRow
                cells={cells}
                link={link}
                columns={columns}
                i={i}
                key={i}
              />
            ))
          ) : (
            <NoRowsMessage text={noRowsText} colSpan={columns.length} />
          )}
        </tbody>
      </table>
    </div>
  )
}
