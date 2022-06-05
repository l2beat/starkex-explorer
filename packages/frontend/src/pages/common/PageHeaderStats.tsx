import classNames from 'classnames'
import React, { ReactNode } from 'react'

type StatRowProps = {
  even: boolean
  title: string
  content: ReactNode
  fontRegular?: boolean
}

function StatRow({ even, title, content, fontRegular }: StatRowProps) {
  return (
    <tr className={classNames(even && ' bg-grey-200')}>
      <th
        className="p-1.5 text-right font-bold first-letter:capitalize"
        scope="row"
      >
        {title}
      </th>
      <td
        className={classNames(
          'max-w-[560px] p-1.5 overflow-x-hidden text-ellipsis',
          !fontRegular && 'font-mono'
        )}
      >
        {content}
      </td>
    </tr>
  )
}

export type PageHeaderStatsProps = {
  rows: Omit<StatRowProps, 'even'>[]
}

export function PageHeaderStats({ rows }: PageHeaderStatsProps) {
  return (
    <div className="w-full overflow-x-auto mb-6 sm:mb-12 ">
      <table className="whitespace-nowrap w-full">
        <tbody>
          {rows.map((stat, i) => (
            <StatRow key={i} {...stat} even={i % 2 === 0} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
