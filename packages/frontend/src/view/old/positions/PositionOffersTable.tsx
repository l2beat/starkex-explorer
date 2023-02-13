import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { ClientPaginatedTable, Column, Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import {
  formatApproximation,
  formatCurrencyApproximation,
  formatRelativeTime,
} from '../formatting'
import { OfferHistoryEntry } from './PositionDetailsProps'

export interface PositionOffersTableProps {
  readonly offers: readonly OfferHistoryEntry[]
  readonly paginated?: boolean
}

export function PositionOffersTable(props: PositionOffersTableProps) {
  const noRowsText = 'this position has no offer history'
  const rows = props.offers.map(buildOfferHistoryRow)
  if (props.paginated) {
    return (
      <ClientPaginatedTable
        id="position-offers"
        noRowsText={noRowsText}
        columns={offerHistoryColumns}
        rows={rows}
      />
    )
  } else {
    return (
      <Table
        noRowsText={noRowsText}
        columns={offerHistoryColumns}
        rows={rows}
      />
    )
  }
}

const offerHistoryColumns: Column[] = [
  { header: 'No.' },
  { header: 'Type' },
  { header: 'Role' },
  { header: 'Time', className: 'min-w-[12ch]' },
  { header: 'Status' },
  { header: 'Amount', numeric: true, fullWidth: true },
  { header: 'Asset' },
  { header: 'Total', numeric: true },
]

function buildOfferHistoryRow(offer: OfferHistoryEntry) {
  return {
    link: `/forced/offers/${offer.id}`,
    cells: [
      offer.id,
      offer.type,
      offer.role,
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
        ? offer.accepted.transactionHash
          ? 'Completed'
          : 'Taker found'
        : 'Looking for a taker',
      formatApproximation(
        offer.syntheticAmount,
        AssetId.decimals(offer.syntheticAssetId),
        3
      ),
      <AssetCell assetId={offer.syntheticAssetId} />,
      formatCurrencyApproximation(offer.collateralAmount, AssetId.USDC, 3),
    ],
  }
}
