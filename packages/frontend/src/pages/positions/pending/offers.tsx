import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { Table } from '../../common/table'
import {
  formatCurrencyApproximation,
  formatRelativeTime,
} from '../../formatting'
import { OfferType } from '../../offers'

function buildPendingOfferRow(offer: OfferHistoryEntry) {
  return {
    link: `/forced/offers/${offer.id}`,
    cells: [
      offer.id,
      offer.type === 'buy' ? 'Buy' : 'Sell',
      offer.role === 'maker' ? 'Maker' : 'Taker',
      offer.accepted ? (
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
        offer.amountSynthetic,
        offer.syntheticAssetId,
        3
      ),
      formatCurrencyApproximation(offer.amountCollateral, AssetId.USDC, 3),
    ],
  }
}

export interface OfferHistoryEntry {
  id: number
  type: OfferType
  role: 'maker' | 'taker'
  createdAt: Timestamp
  accepted?: {
    submissionExpirationTime: bigint
  }
  cancelledAt?: Timestamp
  syntheticAssetId: AssetId
  amountSynthetic: bigint
  amountCollateral: bigint
}

interface ActiveOffersProps {
  offers: readonly OfferHistoryEntry[]
}

export function ActiveOffers({ offers }: ActiveOffersProps) {
  if (offers.length === 0) {
    return null
  }
  return (
    <>
      <div className="mb-1.5 font-medium text-lg text-left">
        Active force trade offers
      </div>
      <Table
        noRowsText=""
        columns={[
          { header: 'Id' },
          { header: 'Type' },
          { header: 'Role' },
          { header: 'Time', className: 'min-w-[12ch]' },
          { header: 'Status' },
          { header: 'Amount', numeric: true },
          { header: 'Total', numeric: true },
        ]}
        rows={offers.map(buildPendingOfferRow)}
        className="mb-12"
      />
    </>
  )
}
