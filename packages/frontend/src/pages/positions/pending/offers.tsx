import { AssetId } from '@explorer/types'
import React from 'react'

import { AssetCell } from '../../common/AssetCell'
import { formatCurrencyUnits } from '../../formatting'
import { OfferType } from '../../offers'
import { AcceptOfferForm, AcceptOfferFormData } from '../../offers/accept-form'
import { CancelOfferForm, CancelOfferFormData } from '../../offers/cancel-form'
import { PendingRow } from './row'

export interface PendingOfferEntry {
  id: number
  type: OfferType
  syntheticAssetId: AssetId
  amountSynthetic: bigint
  amountCollateral: bigint
  accepted?: {
    submissionExpirationTime: bigint
  }
  acceptForm?: AcceptOfferFormData
  cancelForm?: CancelOfferFormData
}

interface PendingOffersProps {
  offers: readonly PendingOfferEntry[]
}

export function PendingOffers({ offers }: PendingOffersProps) {
  return (
    <>
      <div className="mb-1.5 font-medium text-lg text-left">Pending Offers</div>
      <table
        className="w-full border-separate mb-12"
        style={{ borderSpacing: '0 4px' }}
      >
        {offers.map((offer, i) => {
          const status = offer.accepted ? 'Matched!' : 'Offer created'
          const timeLeft = offer.accepted && (
            <span data-timestamp={offer.accepted.submissionExpirationTime}>
              ...
            </span>
          )
          const controls = [
            offer.cancelForm && (
              <CancelOfferForm {...offer.cancelForm}>
                <button className="px-3 rounded bg-grey-300">Cancel</button>
              </CancelOfferForm>
            ),
            offer.acceptForm && (
              <AcceptOfferForm {...offer.acceptForm}>
                <button className="px-3 rounded bg-grey-300">Accept</button>
              </AcceptOfferForm>
            ),
          ]
          return (
            <PendingRow
              key={i}
              cells={[
                offer.type === 'buy' ? 'Buy' : 'Sell',
                formatCurrencyUnits(
                  offer.amountSynthetic,
                  offer.syntheticAssetId
                ),
                <AssetCell assetId={offer.syntheticAssetId} />,
                formatCurrencyUnits(offer.amountCollateral, AssetId.USDC),
                <AssetCell assetId={AssetId.USDC} />,
                status,
                timeLeft,
                ...controls,
              ]}
              accent={!!offer.accepted}
              fullWidth={6}
              numeric={[1, 3]}
            />
          )
        })}
      </table>
    </>
  )
}
