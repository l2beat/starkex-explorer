import React from 'react'

import { AssetNameCell } from '../common/AssetNameCell'
import { Page } from '../common/Page'
import { PageHeaderStats } from '../common/PageHeaderStats'
import { SimpleLink } from '../common/SimpleLink'
import { Table } from '../common/Table'
import {
  formatAbsoluteTime,
  formatCurrency,
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
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
            content: formatHashLong(hash),
          },
          {
            title: 'State tree root',
            content: formatHashLong(rootHash),
          },
          {
            title: 'Ethereum block number',
            content: <SimpleLink href="/">{blockNumber.toString()}</SimpleLink>,
          },
          {
            title: 'Timestamp',
            content: formatAbsoluteTime(timestamp),
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
              formatHashLong(publicKey),
              previousTotalUSDCents
                ? formatCurrency(previousTotalUSDCents, 'USD')
                : '-',
              formatCurrency(totalUSDCents, 'USD'),
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
          const link = `/forced/${transaction.hash}`
          return {
            link,
            cells: [
              transaction.type,
              formatRelativeTime(transaction.lastUpdate),
              formatHashLong(transaction.hash),
              formatCurrencyUnits(transaction.amount, transaction.assetId),
              <AssetNameCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
