import React, { ReactNode } from 'react'
import cx from 'classnames'

type Cell = ReactNode

type Row = {
  cells: Cell[]
  link?: string
}

type Column = {
  header: string
  numeric?: boolean
  maxWidth?: boolean
  cellFontMono?: boolean
}

type TableProps = {
  columns: Column[]
  rows: Row[]
  className?: string
}

const textAlign = (numeric?: boolean) => (numeric ? 'text-right' : 'text-left')
const cellPaddings = 'px-2 py-0.5'
const cellOverflowStyles = 'text-ellipsis overflow-hidden'
const maxWidthStyles = (maxWidth?: boolean) => maxWidth && 'max-w-[320px]'

export function Table({ columns, rows, className }: TableProps) {
  return (
    <div className={cx('overflow-x-auto w-full', className)}>
      <table className="w-full whitespace-nowrap">
        <thead>
          <tr className="bg-grey-300 font-medium">
            {columns.map(({ header, numeric, maxWidth }, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'px-2 py-1 border-2 border-grey-100 rounded-md',
                  textAlign(numeric),
                  maxWidthStyles(maxWidth)
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ cells, link }, i) => {
            return (
              <tr
                key={i}
                className={cx(
                  'my-4 hover:bg-blue-100',
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                )}
              >
                {cells.map((cell, col) => {
                  const { maxWidth, numeric, cellFontMono } = columns[col] || {}
                  const content = link ? (
                    <a
                      href={link}
                      className={cx(
                        'block',
                        cellPaddings,
                        maxWidth && cellOverflowStyles
                      )}
                    >
                      {cell}
                    </a>
                  ) : (
                    cell
                  )
                  return (
                    <td
                      key={col}
                      className={cx(
                        !link && cellPaddings,
                        (numeric || cellFontMono) && 'font-mono',
                        textAlign(numeric),
                        maxWidthStyles(maxWidth),
                        maxWidth && !link && cellOverflowStyles
                      )}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
