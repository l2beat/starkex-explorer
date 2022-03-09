import React from 'react'

import { Page } from '../common/Page'
import { PositionDetailsProps } from './PositionDetailsProps'

const centsToFixedDollars = (cents: bigint) => {
  const centsString = cents.toString().padEnd(3, '0')
  return centsString.slice(0, -2) + '.' + centsString.slice(-2)
}

export function PositionDetails({
  positionId,
  assets,
  publicKey,
  totalUSDCents,
  history,
}: PositionDetailsProps) {
  const sorted = [...history].sort((a, b) =>
    a.stateUpdateId < b.stateUpdateId ? -1 : 1
  )

  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${positionId.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
    >
      <div className="bg-white border-2 border-black p-2">
        <p>Public key: {publicKey}</p>
        <p>Total USD: {centsToFixedDollars(totalUSDCents)}</p>
        <div>Assets</div>
        <ul>
          {assets.map(({ assetId, balance, totalUSDCents }) => (
            <li key={assetId}>
              <p>Asset id: {assetId}</p>
              <p>Balance: {balance.toString()}</p>
              <p>Total USD: {centsToFixedDollars(totalUSDCents)}</p>
            </li>
          ))}
        </ul>
        <div className="bg-zinc-100 text-center p-2 border border-black mt-2">
          Position History
        </div>
        <ul>
          {sorted.map(
            ({ balances, collateralBalance, publicKey, stateUpdateId }, i) => (
              <li key={i} className="my-4">
                <div className="w-full grid gap-2 grid-cols-[auto_1fr_auto]">
                  <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                  <div>
                    <div className="text-zinc-500 font-bold">{publicKey}</div>
                    <div className="text-zinc-800">
                      State Update {stateUpdateId.toString()}
                    </div>
                    <div className="font-semibold">
                      Collateral balance: {collateralBalance.toString()}
                    </div>
                    <dl>
                      {balances.map(({ assetId, balance }) => (
                        <div key={assetId}>
                          <dt className="inline text-zinc-600">{assetId}: </dt>
                          <dd className="inline ml-1">{balance.toString()}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      </div>
    </Page>
  )
}
