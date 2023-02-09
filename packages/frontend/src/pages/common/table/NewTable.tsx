import cx from 'classnames'
import React from 'react'

import { NewTableRow } from './NewTableRow'
import { NoRowsMessage } from './NoRowsMessage'
import { TableProps } from './types'

export function NewTable(props: TableProps) {
  return (
    <div className={cx('overflow-x-auto w-full mb-8 px-6 pb-7 pt-3 bg-blue-900 rounded-lg', props.className)}>
      <table id={props.id} className="w-full whitespace-nowrap">
        <thead>
          <tr>
            {props.columns.map((column, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'pb-0.5 first:pl-12 last:pr-12 font-medium p-0',
                  column.textAlignClass ??
                    (column.numeric ? 'text-right' : 'text-left'),
                  !column.fullWidth && 'w-0',
                  column.className
                )}
              >
                <div className="py-0.5 text-xs text-grey-500">
                  {column.header}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.length > 0 ? (
            props.rows.map(({ cells, link }, i) => (
              <NewTableRow
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
