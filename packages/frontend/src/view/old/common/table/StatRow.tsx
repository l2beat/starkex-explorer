import classNames from 'classnames'
import React, { ReactNode } from 'react'

export interface StatRowProps {
  even: boolean
  title: string
  content: ReactNode
  fontRegular?: boolean
}

export function StatRow({ even, title, content, fontRegular }: StatRowProps) {
  return (
    <tr className={classNames(even && ' bg-gray-200')}>
      <th
        className="p-1.5 text-right font-bold first-letter:capitalize"
        scope="row"
      >
        {title}
      </th>
      <td
        className={classNames(
          'max-w-[560px] overflow-x-hidden text-ellipsis p-1.5',
          !fontRegular && 'font-mono'
        )}
      >
        {content}
      </td>
    </tr>
  )
}
