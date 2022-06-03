import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { Table } from '../../common/table'
import {
  formatCurrencyApproximation,
  formatRelativeTime,
} from '../../formatting'
import { OfferType } from '../../offers'
import { AcceptOfferFormData } from '../../offers/accept-form'
import { CancelOfferFormData } from '../../offers/cancel-form'
import { FinalizeOfferFormData } from '../../offers/finalize-form'

function buildPendingOfferRow(offer: PendingOffer) {
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
      offer.accepted ? 'Taker found' : 'Looking for a taker',
      formatCurrencyApproximation(
        offer.amountSynthetic,
        offer.syntheticAssetId,
        3
      ),
      formatCurrencyApproximation(offer.amountCollateral, AssetId.USDC, 3),
    ],
  }
}

export interface PendingOffer {
  id: number
  type: OfferType
  role: 'maker' | 'taker'
  createdAt: Timestamp
  syntheticAssetId: AssetId
  amountSynthetic: bigint
  amountCollateral: bigint
  accepted?: {
    submissionExpirationTime: bigint
  }
  acceptForm?: AcceptOfferFormData
  cancelForm?: CancelOfferFormData
  finalizeForm?: FinalizeOfferFormData
}

interface PendingOffersProps {
  offers: readonly PendingOffer[]
}

export function PendingOffers({ offers }: PendingOffersProps) {
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
