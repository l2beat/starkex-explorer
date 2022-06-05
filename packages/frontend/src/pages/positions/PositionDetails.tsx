import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { EtherscanLink } from '../common/EtherscanLink'
import { PageHeading } from '../common/header/PageHeading'
import { SectionHeading } from '../common/header/SectionHeading'
import { Page } from '../common/page/Page'
import { SimpleLink } from '../common/SimpleLink'
import { ClientPaginatedTable, Column, Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { StatsTable } from '../common/table/StatsTable'
import {
  formatAbsoluteTime,
  formatCurrency,
  formatCurrencyApproximation,
  formatCurrencyUnits,
  formatHashLong,
  formatRelativeTime,
} from '../formatting'
import { OfferHistoryEntry, PositionDetailsProps } from './PositionDetailsProps'

const balanceTableColumns = (ownedByYou: boolean) => {
  const columns: Column[] = [
    { header: 'Name' },
    { header: 'Balance', numeric: true, fullWidth: true },
    { header: 'Unit price', numeric: true },
    { header: 'Value', numeric: true, fullWidth: true },
  ]

  if (ownedByYou) {
    columns.push({ header: 'Forced' })
  }

  return columns
}

interface ActionButtonProps {
  assetId: AssetId
  balance: bigint
}

function ActionButton({ assetId, balance }: ActionButtonProps) {
  if (balance === 0n || (assetId === AssetId.USDC && balance < 0n)) {
    return null
  }
  return (
    <a
      href={`/forced/new?assetId=${assetId}`}
      className="px-3 py-0.5 rounded bg-blue-100"
    >
      {assetId === AssetId.USDC ? 'Exit' : balance < 0n ? 'Buy' : 'Sell'}
    </a>
  )
}

const buildBalanceTableRow =
  (ownedByYou: boolean) =>
  ({
    assetId,
    balance,
    totalUSDCents,
    priceUSDCents,
  }: PositionDetailsProps['assets'][number]) => {
    const cells = [
      <AssetCell assetId={assetId} />,
      formatCurrencyUnits(balance, assetId),
      formatCurrency(priceUSDCents, 'USD'),
      formatCurrency(totalUSDCents, 'USD'),
    ]
    if (ownedByYou) {
      cells.push(<ActionButton assetId={assetId} balance={balance} />)
    }
    return { cells }
  }

const updateHistoryTableColumns = [
  { header: 'State update' },
  { header: 'Value before', numeric: true },
  { header: 'Value after', numeric: true },
  { header: 'Asset updates', numeric: true },
]
const buildUpdateHistoryTableRow =
  (positionId: bigint) =>
  (
    {
      stateUpdateId,
      totalUSDCents,
      assetsUpdated,
    }: PositionDetailsProps['history'][number],
    i: number,
    history: PositionDetailsProps['history']
  ) => {
    const previousTotal = history[i + 1]?.totalUSDCents
    const valueBefore = previousTotal
      ? `${formatCurrency(previousTotal, 'USD')}`
      : '-'

    return {
      link: `/positions/${positionId}/updates/${stateUpdateId}`,
      cells: [
        stateUpdateId.toString(),
        valueBefore,
        formatCurrency(totalUSDCents, 'USD'),
        assetsUpdated.toString(),
      ],
    }
  }

const transactionHistoryTableColumns: Column[] = [
  { header: 'Type' },
  { header: 'Time' },
  { header: 'Status' },
  { header: 'Hash', monospace: true, fullWidth: true },
  { header: 'Amount', numeric: true },
  { header: 'Asset' },
]

const buildTransactionHistoryTableRow = (
  transaction: PositionDetailsProps['transactions'][number]
) => {
  const link = `/forced-transactions/${transaction.hash}`
  return {
    link,
    cells: [
      transaction.type,
      formatRelativeTime(transaction.lastUpdate),
      transaction.status,
      formatHashLong(transaction.hash),
      formatCurrencyUnits(transaction.amount, transaction.assetId),
      <AssetCell assetId={transaction.assetId} />,
    ],
  }
}

function buildOfferHistoryRow(offer: OfferHistoryEntry) {
  return {
    link: `/forced/offers/${offer.id}`,
    cells: [
      offer.id,
      offer.type === 'buy' ? 'Buy' : 'Sell',
      offer.role === 'maker' ? 'Maker' : 'Taker',
      offer.cancelledAt ? (
        formatRelativeTime(offer.cancelledAt)
      ) : offer.accepted ? (
        <span
          data-timestamp={Timestamp.fromHours(
            offer.accepted.submissionExpirationTime
          )}
        >
          ...
        </span>
      ) : (
        formatRelativeTime(offer.createdAt)
      ),
      offer.cancelledAt
        ? 'Cancelled'
        : offer.accepted
        ? 'Taker found'
        : 'Looking for a taker',
      formatCurrencyApproximation(
        offer.syntheticAmount,
        offer.syntheticAssetId,
        3
      ),
      formatCurrencyApproximation(offer.collateralAmount, AssetId.USDC, 3),
    ],
  }
}

const offerHistoryColumns: Column[] = [
  { header: 'Id' },
  { header: 'Type' },
  { header: 'Role' },
  { header: 'Time', className: 'min-w-[12ch]' },
  { header: 'Status' },
  { header: 'Amount', numeric: true, fullWidth: true },
  { header: 'Total', numeric: true },
]

export function PositionDetails({
  positionId,
  assets,
  starkKey,
  stateUpdateId,
  lastUpdateTimestamp,
  ethAddress,
  history,
  transactions,
  account,
  offers,
  ownedByYou,
}: PositionDetailsProps) {
  return (
    <Page
      title={`Position ${positionId}`}
      description="View details of this position including all assets, all changes to the position, all associated forced transactions and all associated forced trade offers."
      path={`/positions/${positionId}`}
      account={account}
    >
      <div className="mb-8 flex items-center">
        <PageHeading className="!mb-0">
          Position #{positionId.toString()}
        </PageHeading>
        {ownedByYou && (
          <span className="ml-4 px-2 bg-blue-100 rounded-full">
            Owned by you
          </span>
        )}
      </div>
      {transactions.some(
        (tx) => tx.status === 'waiting to be included' || tx.status === 'sent'
      ) && (
        <>
          <SectionHeading active={ownedByYou}>
            Pending force transactions
          </SectionHeading>
          <Table
            noRowsText=""
            columns={transactionHistoryTableColumns}
            rows={transactions
              .flatMap((tx) =>
                tx.status === 'waiting to be included' || tx.status === 'sent'
                  ? [tx]
                  : []
              )
              .map(buildTransactionHistoryTableRow)}
          />
        </>
      )}
      {offers.some((offer) => !offer.cancelledAt) && (
        <>
          <SectionHeading active={ownedByYou}>
            Active force trade offers
          </SectionHeading>
          <Table
            noRowsText=""
            columns={offerHistoryColumns}
            rows={offers
              .flatMap((offer) => (offer.cancelledAt ? [] : [offer]))
              .map(buildOfferHistoryRow)}
          />
        </>
      )}
      <SectionHeading>Stats</SectionHeading>
      <StatsTable
        rows={[
          {
            title: 'Owner ETH address',
            content: ethAddress ? (
              <EtherscanLink address={ethAddress}>{ethAddress}</EtherscanLink>
            ) : (
              '-'
            ),
          },
          {
            title: 'Owner stark key',
            content: formatHashLong(starkKey),
          },
          {
            title: 'Last state update',
            content: (
              <SimpleLink href={`/state-updates/${stateUpdateId}`}>
                #{stateUpdateId.toString()}
              </SimpleLink>
            ),
          },
          {
            title: 'Last update timestamp',
            content: formatAbsoluteTime(lastUpdateTimestamp),
            fontRegular: true,
          },
        ]}
      />
      <SectionHeading>Balances</SectionHeading>
      <Table
        noRowsText="this position has no balances"
        columns={balanceTableColumns(ownedByYou)}
        rows={assets.map(buildBalanceTableRow(ownedByYou))}
      />
      <SectionHeading>Update history</SectionHeading>
      <ClientPaginatedTable
        id="position-history"
        noRowsText="this position has no update history"
        columns={updateHistoryTableColumns}
        rows={history.map(buildUpdateHistoryTableRow(positionId))}
      />
      <SectionHeading>Force transaction history</SectionHeading>
      <ClientPaginatedTable
        id="position-transactions"
        noRowsText="there are no forced transactions associated with this position"
        columns={transactionHistoryTableColumns}
        rows={transactions.map(buildTransactionHistoryTableRow)}
      />
      <SectionHeading>Force trade offer history</SectionHeading>
      <ClientPaginatedTable
        id="position-offers"
        noRowsText="this position has no offer history"
        columns={offerHistoryColumns}
        rows={offers.map(buildOfferHistoryRow)}
      />
    </Page>
  )
}
