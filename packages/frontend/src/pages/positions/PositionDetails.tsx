import React from 'react'
import { centsToFixedDollars } from '../centsToFixedDollars'

import { Page } from '../common/Page'
import { PositionDetailsProps } from './PositionDetailsProps'

export function PositionDetails({
  positionId,
  assets,
  publicKey,
  totalUSDCents,
  history,
}: PositionDetailsProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        Position #{positionId.toString()}
      </h1>
      <h2 className="mb-2">
        <span className="font-bold font-sans text-xl">Total: </span>
        <span className="font-mono text-lg">
          ${centsToFixedDollars(totalUSDCents)}
        </span>
      </h2>
      <h2 className="mb-12">
        <span className="font-bold font-sans text-xl">Key: </span>
        <span className="font-mono text-lg">{publicKey}</span>
      </h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full whitespace-nowrap">
          <caption className="mb-1.5 font-medium text-lg text-left">
            Assets
          </caption>
          <thead>
            <tr className="bg-grey-300 font-medium">
              <th
                scope="col"
                className="text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Asset id
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Balance
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Value
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, i) => (
              <tr
                key={i}
                className={`my-4 hover:bg-blue-100 ${
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                }`}
              >
                <td className="px-2 py-0.5">{asset.assetId}</td>
                <td className="px-2 py-0.5 font-mono text-right">
                  {asset.balance.toString()}
                </td>
                <td className="px-2 py-0.5 font-mono text-right">
                  ${centsToFixedDollars(asset.totalUSDCents)}
                </td>
                <td className="px-2 py-0.5 font-mono text-right">
                  {asset.price ? `$${asset.price}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto mb-8">
        <table className="w-full whitespace-nowrap">
          <caption className="mb-1.5 font-medium text-lg text-left">
            Update history
          </caption>
          <thead>
            <tr className="bg-grey-300 font-medium">
              <th
                scope="col"
                className="text-left px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                State update
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Value before
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Value after
              </th>
              <th
                scope="col"
                className="text-right px-2 py-1 border-2 border-grey-100 rounded-md"
              >
                Asset updates
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((update, i) => (
              <tr
                key={i}
                className={`my-4 hover:bg-blue-100 ${
                  i % 2 === 0 ? 'bg-grey-100' : 'bg-grey-200'
                }`}
              >
                <td className="px-2 py-0.5">{update.stateUpdateId}</td>
                <td className="px-2 py-0.5 font-mono text-right">
                  {history[i + 1]?.totalUSDCents
                    ? `$${centsToFixedDollars(history[i + 1].totalUSDCents)}`
                    : '-'}
                </td>
                <td className="px-2 py-0.5 font-mono text-right">
                  ${centsToFixedDollars(update.totalUSDCents)}
                </td>
                <td className="px-2 py-0.5 font-mono text-right">
                  {update.assetsUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
