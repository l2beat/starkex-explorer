import { AssetId, EthereumAddress, Timestamp } from '@explorer/types'
import React from 'react'

import { AssetCell } from '../../common/AssetCell'
import { formatCurrencyUnits } from '../../formatting'
import { OfferType } from '../../offers'
import { CancelOfferForm } from '../../offers/cancel-form'
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
}

const AcceptButton = () => (
  <button className="px-3 rounded bg-blue-100">Accept offer</button>
)

const FinalizeButton = () => (
  <button className="px-3 rounded bg-blue-100">Finalize</button>
)

interface PendingOffersProps {
  offers: readonly PendingOfferEntry[]
  account?: EthereumAddress
  positionAddress?: EthereumAddress
}

export function PendingOffers({
  offers,
  account,
  positionAddress,
}: PendingOffersProps) {
  const ownedByYou = positionAddress && account && positionAddress === account
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
            offer.accepted && ownedByYou && (
              <CancelOfferForm offerId={offer.id} address={account}>
                <button className="px-3 rounded bg-grey-300">Cancel</button>
              </CancelOfferForm>
            ),
            offer.accepted && ownedByYou && <FinalizeButton />,
            !offer.accepted && !ownedByYou && <AcceptButton />,
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
