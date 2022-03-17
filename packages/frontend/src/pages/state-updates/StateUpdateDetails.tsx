import React from 'react'
import { Page } from '../common/Page'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { formatUSDCents } from '../formatUSDCents'
import { Table } from '../common/Table'
import { StateUpdateStats } from './StateUpdatesStats'

export function StateUpdateDetails({
  id,
  hash,
  rootHash,
  positions,
  blockNumber,
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
        State update #{id.toString()}
      </h1>
      <StateUpdateStats
        stateHash={hash}
        rootHash={rootHash}
        blockNumber={blockNumber}
        timestamp={timestamp}
      />
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
