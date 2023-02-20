import { AssetId } from '@explorer/types'
import React from 'react'

import { Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import {
  formatCurrency,
  formatCurrencyUnits,
  formatRelativeTime,
} from '../formatting'
import { ForcedTradeOfferEntry } from './ForcedTradeOffersIndexProps'

export interface ForcedTradeOffersTableProps {
  readonly offers: readonly ForcedTradeOfferEntry[]
}

export function ForcedTradeOffersTable({
  offers,
}: ForcedTradeOffersTableProps) {
  return (
    <Table
      noRowsText="there is no active offers at the moment"
      columns={[
        { header: 'No.' },
        { header: 'Type' },
        { header: 'Time' },
        { header: 'Position' },
        { header: 'Amount', numeric: true, fullWidth: true },
        { header: 'Asset' },
        { header: 'Price', numeric: true },
        { header: 'Total', numeric: true },
      ]}
      rows={offers.map((offer) => {
        return {
          link: `/forced/offers/${offer.id}`,
          cells: [
            offer.id,
            offer.type,
            formatRelativeTime(offer.createdAt),
            offer.positionId.toString(),
            formatCurrencyUnits(offer.amount, offer.assetId),
            <AssetCell assetId={offer.assetId} />,
            formatCurrency(offer.price, 'USD'),
            formatCurrency(offer.total, AssetId.USDC),
          ],
        }
      })}
    />
  )
}
