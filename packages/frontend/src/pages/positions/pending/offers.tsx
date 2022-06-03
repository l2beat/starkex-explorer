import { AssetId, Timestamp } from '@explorer/types'
import React from 'react'

import { AssetCell } from '../../common/AssetCell'
import { formatCurrencyUnits } from '../../formatting'
import { OfferType } from '../../offers'
import { AcceptOfferForm, AcceptOfferFormData } from '../../offers/accept-form'
import { CancelOfferForm, CancelOfferFormData } from '../../offers/cancel-form'
import {
  FinalizeOfferForm,
  FinalizeOfferFormData,
} from '../../offers/finalize-form'
import { PendingRow } from './row'

function Button({ text }: { text: string }) {
  return <button className="px-3 rounded bg-grey-300">{text}</button>
}

export interface PendingOffer {
  id: number
  type: OfferType
  syntheticAssetId: AssetId
  syntheticAmount: bigint
  collateralAmount: bigint
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
      <div className="mb-1.5 font-medium text-lg text-left">Pending Offers</div>
      <table
        className="w-full border-separate mb-12"
        style={{ borderSpacing: '0 4px' }}
      >
        {offers.map((offer, i) => {
          const status = offer.accepted ? 'Matched!' : 'Offer created'
          const timeLeft = offer.accepted && (
            <span
              data-timestamp={Timestamp.fromHours(
                offer.accepted.submissionExpirationTime
              )}
            >
              ...
            </span>
          )
          const controls = [
            offer.cancelForm && (
              <CancelOfferForm {...offer.cancelForm}>
                <Button text="Cancel" />
              </CancelOfferForm>
            ),
            offer.acceptForm && (
              <AcceptOfferForm {...offer.acceptForm}>
                <Button text="Accept" />
              </AcceptOfferForm>
            ),
            offer.finalizeForm && (
              <FinalizeOfferForm {...offer.finalizeForm}>
                <Button text="Finalize" />Ū
              </FinalizeOfferForm>
            ),
          ]
          return (
            <PendingRow
              key={i}
              cells={[
                offer.type === 'buy' ? 'Buy' : 'Sell',
                formatCurrencyUnits(
                  offer.syntheticAmount,
                  offer.syntheticAssetId
                ),
                <AssetCell assetId={offer.syntheticAssetId} />,
                formatCurrencyUnits(offer.collateralAmount, AssetId.USDC),
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
