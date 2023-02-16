import cx from 'classnames'
import React from 'react'

import { Button } from '../Button'
import { NoRowsMessage } from './NoRowsMessage'
import { TableRow } from './TableRow'
import { Column, Row } from './types'

interface TableProps {
  title: string
  id?: string
  pageSize?: number
  columns: Column[]
  fullBackground?: boolean
  rows: Row[]
  className?: string
  noRowsText: string
}

export function Table(props: TableProps) {
  const pageSize = props.pageSize ?? props.rows.length
  return (
    <div className="mb-8 pb-7">
      <div className="flex items-center justify-between pb-5">
        <p className="text-2xl font-semibold text-white">{props.title}</p>
        {props.pageSize && (
          <p className="text-sm font-medium text-zinc-500">{`You're viewing ${
            props.rows.length < props.pageSize
              ? props.rows.length
              : props.pageSize
          } out of ${props.rows.length} ${props.title.toLowerCase()}`}</p>
        )}
      </div>
      <div
        className={cx(
          'w-full overflow-x-auto rounded-lg  pt-3',
          { 'bg-gray-800 px-6 pb-8': props.fullBackground },
          props.className
        )}
      >
        <table
          id={props.id}
          cellPadding="0"
          cellSpacing="0"
          className="w-full whitespace-nowrap"
          style={{ borderSpacing: 0 }}
        >
          <thead className="bg-gray-800">
            <tr>
              {props.columns.map((column, i) => (
                <th
                  scope="col"
                  key={i}
                  className={cx(
                    'first:rounded-l-action-button last:rounded-r-action-button border-0 border-none p-0 pb-0.5 font-medium first:pl-6 last:pr-6',
                    column.textAlignClass ??
                      (column.numeric ? 'text-right' : 'text-left'),
                    column.className
                  )}
                >
                  <div className="py-0.5 text-xs text-zinc-500">
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
                  hidden={i >= pageSize}
                  cells={cells}
                  link={link}
                  columns={props.columns}
                  i={i}
                  key={i}
                  className={
                    !props.fullBackground ? 'first:pl-6 last:pr-6' : undefined
                  }
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
      {props.rows.length > pageSize && (
        <div className="flex items-center justify-center pt-3">
          <Button variant="OUTLINED">
            View all {props.title.toLowerCase()}
          </Button>
        </div>
      )}
    </div>
  )
}
