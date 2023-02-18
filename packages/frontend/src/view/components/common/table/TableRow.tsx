import cx from 'classnames'
import React from 'react'

import { Column, Row } from './types'

export interface TableRowProps extends Row {
  i: number
  columns: Column[]
}

export function TableRow(props: TableRowProps) {
  return (
    <tr className="h-10 whitespace-nowrap text-sm font-medium">
      {props.cells.map((cell, col) => {
        const { numeric, monospace, className } = props.columns[col] ?? {}

        return (
          <td
            key={col}
            className={cx(
              !props.link && 'px-2.5',
              !props.link && col === 0 && 'pl-5',
              !props.link && col === props.cells.length - 1 && 'pr-5',
              (numeric || monospace) && 'font-mono',
              numeric && 'text-right',
              props.link && 'cursor-pointer',
              !props.link && className
            )}
          >
            {props.link ? (
              <a
                className={cx(
                  'flex h-10 items-center px-2.5',
                  col === 0 && 'pl-5',
                  col === props.cells.length - 1 && 'pr-5',
                  className
                )}
                href={props.link}
              >
                <span className="w-full">{cell}</span>
              </a>
            ) : (
              cell
            )}
          </td>
        )
      })}
    </tr>
  )
}
