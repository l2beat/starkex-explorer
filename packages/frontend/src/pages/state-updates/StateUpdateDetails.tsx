import React from 'react'

import { EtherscanLink } from '../common/EtherscanLink'
import { PageHeading } from '../common/header/PageHeading'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { ClientPaginatedTable } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { StatsTable } from '../common/table/StatsTable'
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
      title={`State update ${id}`}
      description="View details of this state update including all changed positions and all included forced transactions."
      path={`/state-updates/${id}`}
      account={account}
    >
      <PageHeading>State update #{id.toString()}</PageHeading>
      <StatsTable
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
            content: (
              <EtherscanLink block={blockNumber}>{blockNumber}</EtherscanLink>
            ),
          },
          {
            title: 'Timestamp',
            content: formatAbsoluteTime(timestamp),
            fontRegular: true,
          },
        ]}
      />
      <SectionHeading>Updated positions</SectionHeading>
      <ClientPaginatedTable
        id="state-positions"
        noRowsText="this update did not affect any position"
        className="mb-8"
        columns={[
          { header: 'Position id' },
          { header: 'Owner', monospace: true, fullWidth: true },
          { header: 'Value before', numeric: true },
          { header: 'Value after', numeric: true },
          { header: 'Assets updated', numeric: true },
        ]}
        rows={positions.map(
          ({
            positionId,
            starkKey,
            totalUSDCents,
            previousTotalUSDCents,
            assetsUpdated,
          }) => ({
            cells: [
              positionId.toString(),
              formatHashLong(starkKey),
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
      <SectionHeading>Included forced transactions</SectionHeading>
      <ClientPaginatedTable
        id="state-transactions"
        noRowsText="this update does not include any forced transactions"
        columns={[
          { header: 'Type' },
          { header: 'Time' },
          { header: 'Hash', monospace: true, fullWidth: true },
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
              <AssetCell assetId={transaction.assetId} />,
              transaction.positionId.toString(),
            ],
          }
        })}
      />
    </Page>
  )
}
