import React from 'react'
import { Page } from '../common/Page'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { formatTime } from '../formatTime'
import { centsToFixedDollars } from '../centsToFixedDollars'

export function StateUpdateDetails({
  id,
  hash,
  positions,
  timestamp,
}: StateUpdateDetailsProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${hash.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        State update #{id.toString()} ({formatTime(timestamp)})
      </h1>
      <h2 className="mb-2">
        <span className="font-bold font-sans text-xl">Hash: </span>
        <span className="font-mono text-lg">{hash}</span>
      </h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full whitespace-nowrap">
          <caption className="mb-1.5 font-medium text-lg text-left">
            Updated positions
          </caption>
          <thead>
            <tr className="bg-grey-300 font-medium">
              <th
                scope="col"
                className="text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Position id
              </th>
              <th
                scope="col"
                className="max-w-[320px] text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Owner
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Value after
              </th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position, i) => (
              <tr
                key={i}
                className={`my-4 hover:bg-blue-100 ${
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                }`}
              >
                <td className="px-2 py-0.5">
                  {position.positionId.toString()}
                </td>
                <td className="max-w-[320px] px-2 py-0.5 font-mono text-right text-ellipsis overflow-hidden">
                  {position.publicKey}
                </td>
                <td className="px-2 py-0.5 font-mono text-right">
                  {centsToFixedDollars(position.totalUSDCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
