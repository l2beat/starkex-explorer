import React from 'react'
import { Page } from '../common/Page'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { formatTime } from '../formatTime'
import { formatUSDCents } from '../formatUSDCents'
import { Table } from '../common/Table'

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
      <div className="mb-1.5 font-medium text-lg text-left">
        Updated positions
      </div>
      <Table
        columns={[
          { header: 'Position id' },
          { header: 'Owner', maxWidth: true, cellFontMono: true },
          { header: 'Value after', numeric: true },
        ]}
        rows={positions.map(({ positionId, publicKey, totalUSDCents }) => ({
          cells: [
            positionId.toString(),
            publicKey,
            formatUSDCents(totalUSDCents),
          ],
        }))}
      />
    </Page>
  )
}
