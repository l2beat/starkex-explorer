import React from 'react'
import { Page } from '../common/Page'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'
import { formatUSDCents } from '../formatUSDCents'
import { Table } from '../common/Table'
import { formatTimestamp, PageHeaderStats } from '../common/PageHeaderStats'
import { formatHash } from '../formatHash'
import { SimpleLink } from '../common/SimpleLink'

export function StateUpdateDetails({
  id,
  hash,
  rootHash,
  positions,
  blockNumber,
  timestamp,
  account,
}: StateUpdateDetailsProps) {
  return (
    <Page
      title={`L2BEAT dYdX Explorer | ${hash.toString()}`}
      description="Site under construction"
      url="https://dydx.l2beat.com"
      image="/images/under-construction.png"
      stylesheets={['/styles/main.css']}
      scripts={['/scripts/main.js']}
      account={account}
    >
      <h1 className="font-sans font-bold text-2xl mb-12">
        State update #{id.toString()}
      </h1>
      <PageHeaderStats
        rows={[
          {
            title: 'State update hash',
            content: hash.toString(),
          },
          {
            title: 'State tree root',
            content: formatHash(rootHash),
          },
          {
            title: 'Ethereum block number',
            content: <SimpleLink href="/">{blockNumber.toString()}</SimpleLink>,
          },
          {
            title: 'Timestamp',
            content: formatTimestamp(timestamp),
            fontRegular: true,
          },
        ]}
      />
      <div className="mb-1.5 font-medium text-lg text-left">
        Updated positions
      </div>
      <Table
        columns={[
          { header: 'Position id' },
          { header: 'Owner', maxWidth: true, cellFontMono: true },
          { header: 'Value before', numeric: true },
          { header: 'Value after', numeric: true },
          { header: 'Assets updated', numeric: true },
        ]}
        rows={positions.map(
          ({
            positionId,
            publicKey,
            totalUSDCents,
            previousTotalUSDCents,
            assetsUpdated,
          }) => ({
            cells: [
              positionId.toString(),
              publicKey,
              previousTotalUSDCents
                ? formatUSDCents(previousTotalUSDCents)
                : '-',
              formatUSDCents(totalUSDCents),
              assetsUpdated ? assetsUpdated.toString() : '0',
            ],
            link: `/positions/${positionId}`,
          })
        )}
      />
    </Page>
  )
}
