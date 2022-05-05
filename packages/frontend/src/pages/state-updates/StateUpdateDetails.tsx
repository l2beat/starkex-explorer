import React from 'react'

import { AssetNameCell } from '../common/AssetNameCell'
import { Page } from '../common/Page'
import { formatTimestamp, PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/Table'
import { formatHash } from '../formatHash'
import { formatLargeNumber } from '../formatLargeNumber'
import { formatTime } from '../formatTime'
import { formatUSDCents } from '../formatUSDCents'
import { StateUpdateDetailsProps } from './StateUpdateDetailsProps'

export function StateUpdateDetails({
  id,
  hash,
  rootHash,
  positions,
  blockNumber,
  timestamp,
  transactions,
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
        noRowsText="this update did not affect any position"
        className="mb-8"
        columns={[
          { header: 'Position id' },
          {
            header: 'Owner',
            className: 'max-w-[320px]',
            cellFontMono: true,
          },
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
      <div className="mb-1.5 font-medium text-lg text-left">
        Included forced transactions
      </div>
      <Table
        noRowsText="this update does not include any forced transactions"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          {
            header: 'Hash',
            cellFontMono: true,
            className: 'max-w-[250px]',
          },
          { header: 'Amount', numeric: true },
          { header: 'Asset' },
          { header: 'Position ID', numeric: true },
        ]}
        rows={transactions.map((transaction) => {
          const link = `/forced-transactions/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatTime(transaction.lastUpdate),
              formatHash(transaction.hash.toString()),
              formatLargeNumber(transaction.amount),
              <AssetNameCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
