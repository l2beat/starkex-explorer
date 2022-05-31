import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { AssetCell } from '../../common/AssetCell'
import { formatCurrencyUnits, formatRelativeTime } from '../../formatting'
import { OfferType } from '../../offers'
import { PendingRow } from './row'

interface OfferEntry {
  type: OfferType
  assetId: AssetId
  amountSynthetic: bigint
  amountCollateral: bigint
}

interface CreatedOfferEntry extends OfferEntry {
  status: 'created'
}

interface MatchedOfferEntry extends OfferEntry {
  status: 'matched'
  expirationTime: Timestamp
}

export type PendingOfferEntry = CreatedOfferEntry | MatchedOfferEntry

export function PendingOffers({
  offers,
}: {
  readonly offers: readonly PendingOfferEntry[]
}) {
  return (
    <>
      <div className="mb-1.5 font-medium text-lg text-left">Pending Offers</div>
      <table
        className="w-full border-separate mb-12"
        style={{ borderSpacing: '0 4px' }}
      >
        {offers.map((offer, i) => (
          <PendingRow
            key={i}
            cells={[
              offer.type === 'buy' ? 'Buy' : 'Sell',
              formatCurrencyUnits(offer.amountSynthetic, offer.assetId),
              <AssetCell assetId={offer.assetId} />,
              formatCurrencyUnits(offer.amountCollateral, AssetId.USDC),
              <AssetCell assetId={AssetId.USDC} />,
              offer.status === 'created' ? 'Offer created' : 'Matched!',
              offer.status === 'matched' &&
                formatRelativeTime(offer.expirationTime),
              offer.status === 'matched' && <button>Cancel</button>,
              offer.status === 'created' ? (
                <button>Accept Offer</button>
              ) : (
                <button>Finalize!</button>
              ),
            ]}
            accent={offer.status === 'matched'}
            fullWidth={6}
            numeric={[1, 3]}
          />
        ))}
      </table>
    </>
  )
}
