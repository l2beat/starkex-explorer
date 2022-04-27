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
  maxWidthClass?: string
  cellFontMono?: boolean
}

type TableProps = {
  columns: Column[]
  rows: Row[]
  className?: string
  noRowsText: string
}

const textAlign = (numeric?: boolean) => (numeric ? 'text-right' : 'text-left')
const cellPaddings = 'px-2 py-0.5'
const cellOverflowStyles = 'text-ellipsis overflow-hidden'

const RowEl = ({
  cells,
  link,
  i,
  columns,
}: Row & { i: number; columns: Column[] }) => (
  <tr
    className={cx(
      'my-4 hover:bg-blue-100',
      i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
    )}
  >
    {cells.map((cell, col) => {
      const { maxWidthClass, numeric, cellFontMono } = columns[col] || {}
      const content = link ? (
        <a
          href={link}
          className={cx(
            'block',
            'first-letter:capitalize',
            cellPaddings,
            maxWidthClass
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
            !link && 'first-letter:capitalize',
            (numeric || cellFontMono) && 'font-mono',
            textAlign(numeric),
            maxWidthClass,
            maxWidthClass && !link && cellOverflowStyles
          )}
        >
          {content}
        </td>
      )
    })}
  </tr>
)

const NoRowsMessage = ({
  text,
  colSpan,
}: {
  text: string
  colSpan: number
}) => (
  <tr>
    <td
      colSpan={colSpan}
      className="first-letter:capitalize bg-grey-200 pt-4 pb-4 text-center"
    >
      {text}
    </td>
  </tr>
)

export function Table({ columns, rows, className, noRowsText }: TableProps) {
  return (
    <div className={cx('overflow-x-auto w-full', className)}>
      <table className="w-full whitespace-nowrap">
        <thead>
          <tr className="bg-grey-300 font-medium">
            {columns.map(({ header, numeric, maxWidthClass }, i) => (
              <th
                scope="col"
                key={i}
                className={cx(
                  'px-2 py-1 border-2 border-grey-100 rounded-md',
                  textAlign(numeric),
                  maxWidthClass
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map(({ cells, link }, i) => (
              <RowEl
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
