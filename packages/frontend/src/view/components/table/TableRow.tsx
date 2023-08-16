import cx from 'classnames'
import React from 'react'

import { Column, Row } from './types'

interface TableRowProps extends Row {
  i: number
  columns: Column[]
  fullBackground?: boolean
  shortenOnMobile?: boolean
}

export function TableRow(props: TableRowProps) {
  return (
    <tr
      className={cx(
        'whitespace-nowrap border-b border-b-zinc-800 border-opacity-50 text-sm font-medium ',
        props.fullBackground ? 'h-16' : 'h-10',
        props.link && 'cursor-pointer hover:bg-gray-900 hover:bg-opacity-40',
        props.shortenOnMobile &&
          '[&:nth-child(n+11)]:hidden xl:[&:nth-child(n+11)]:table-row'
      )}
    >
      {props.cells.map((cell, col) => {
        const { numeric, monospace, className, minimalWidth } =
          props.columns[col] ?? {}

        return (
          <td
            key={col}
            className={cx(
              'first:rounded-l last:rounded-r',
              !props.link && 'px-2 sm:px-2.5',
              !props.link && col === 0 && 'pl-4 sm:pl-5',
              !props.link && col === props.cells.length - 1 && 'pr-4 sm:pr-5',
              minimalWidth && 'w-0',
              (numeric || monospace) && 'font-mono',
              numeric && 'text-right',
              !props.link && className
            )}
          >
            {props.link ? (
              <a
                className={cx(
                  'flex h-[39px] items-center px-2 sm:px-2.5',
                  col === 0 && 'pl-4 sm:pl-5',
                  col === props.cells.length - 1 && 'pr-4 sm:pr-5',
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
