import cx from 'classnames'
import React from 'react'

import { NoRowsMessage } from './NoRowsMessage'
import { TableRow } from './TableRow'
import { TableProps } from './types'

export function Table(props: TableProps) {
  return (
    <div className={cx('overflow-x-auto w-full', props.className)}>
      <table id={props.id} className="w-full whitespace-nowrap">
        <thead>
          <tr>
            {props.columns.map((column, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'p-px pb-0.5 first:pl-0 last:pr-0 font-medium',
                  column.textAlignClass ||
                    (column.numeric ? 'text-right' : 'text-left'),
                  !column.fullWidth && 'w-0',
                  column.className
                )}
              >
                <div className="px-1.5 py0.5 bg-grey-300 rounded-[3px]">
                  {column.header}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.length > 0 ? (
            props.rows.map(({ cells, link }, i) => (
              <TableRow
                hidden={props.hasClientPagination && i >= 10}
                cells={cells}
                link={link}
                columns={props.columns}
                i={i}
                key={i}
              />
            ))
          ) : (
            <NoRowsMessage
              text={props.noRowsText}
              colSpan={props.columns.length}
            />
          )}
        </tbody>
      </table>
    </div>
  )
}
