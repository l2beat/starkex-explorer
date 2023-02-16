import cx from 'classnames'
import React from 'react'

import { Column, Row } from './types'

export interface TableRowProps extends Row {
  i: number
  columns: Column[]
  hidden?: boolean
  className?: string
}

export function TableRow(props: TableRowProps) {
  return (
    <tr className={cx('my-4 whitespace-nowrap', props.hidden && 'hidden')}>
      {props.cells.map((cell, col) => {
        const { fullWidth, numeric, monospace, className } =
          props.columns[col] ?? {}
        return (
          <td
            key={col}
            className={cx(
              !props.link && 'px-1.5 py-0.5',
              'first-letter:capitalize',
              (numeric || monospace) && 'font-mono',
              numeric ? 'text-right' : 'text-left',
              fullWidth ? 'wide:max-w-[10px] truncate' : 'w-0',
              props.link && 'cursor-pointer',
              className,
              props.className
            )}
          >
            {props.link ? (
              <a
                className="block w-full truncate py-0.5 first-letter:capitalize"
                href={props.link}
              >
                {cell}
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
