import { PedersenHash } from '@explorer/types'
import classNames from 'classnames'
import React, { ReactNode } from 'react'
import { SimpleLink } from '../common/SimpleLink'
import { formatHash } from '../formatHash'
import { formatTime } from '../formatTime'

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  const day = date.getUTCDate()
  const month = date.getUTCMonth()
  const year = date.getUTCFullYear()
  const hours = date.getUTCHours()
  const minutes = date.getUTCMinutes()
  const timeAgo = formatTime(timestamp)
  return `${year}-${month}-${day} ${hours}:${minutes} UTC (${timeAgo})`
}

type StatRowProps = {
  even: boolean
  title: string
  content: ReactNode
  fontRegular?: boolean
}

function StatRow({ even, title, content, fontRegular }: StatRowProps) {
  return (
    <tr className={classNames(even ? ' bg-grey-200' : ' bg-grey-100')}>
      <th className="p-1.5 text-right font-bold" scope="row">
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

type StateUpdateStatsProps = {
  stateHash: PedersenHash
  rootHash: PedersenHash
  blockNumber: bigint
  timestamp: number
}

export function StateUpdateStats({
  stateHash,
  rootHash,
  blockNumber,
  timestamp,
}: StateUpdateStatsProps) {
  return (
    <div className="w-full overflow-x-auto mb-12 ">
      <table className="whitespace-nowrap w-full">
        <tbody>
          {[
            {
              title: 'State update hash',
              content: formatHash(stateHash),
            },
            {
              title: 'State tree root',
              content: formatHash(rootHash),
            },
            {
              title: 'Ethereum block number',
              content: (
                <SimpleLink href="/">{blockNumber.toString()}</SimpleLink>
              ),
            },
            {
              title: 'Timestamp',
              content: formatTimestamp(timestamp),
              fontRegular: true,
            },
          ].map((stat, i) => (
            <StatRow key={i} {...stat} even={i % 2 === 0} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
