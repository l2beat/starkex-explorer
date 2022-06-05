import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { ClientPaginatedTable, Column, Table } from '../common/table'
import { formatCurrencyApproximation, formatRelativeTime } from '../formatting'
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
  { header: 'Id' },
  { header: 'Type' },
  { header: 'Role' },
  { header: 'Time', className: 'min-w-[12ch]' },
  { header: 'Status' },
  { header: 'Amount', numeric: true, fullWidth: true },
  { header: 'Total', numeric: true },
]

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
