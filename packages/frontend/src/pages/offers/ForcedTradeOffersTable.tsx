import { AssetId } from '@explorer/types'
import React from 'react'

import { Table } from '../common/table'
import { AssetCell } from '../common/table/AssetCell'
import { formatCurrency, formatRelativeTime } from '../formatting'
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
        { header: 'Position ID', numeric: true },
        { header: 'Time' },
        {
          header: 'Asset',
          numeric: true,
          textAlignClass: 'text-left',
          fullWidth: true,
        },
        { header: 'Price', numeric: true },
        { header: 'Total', numeric: true },
        { header: 'Type' },
      ]}
      rows={offers.map((offer) => {
        const link = `/forced/offers/${offer.id}`
        return {
          link,
          cells: [
            offer.positionId.toString(),
            formatRelativeTime(offer.createdAt),
            <AssetCell assetId={offer.assetId} amount={offer.amount} />,
            formatCurrency(offer.price, 'USD'),
            formatCurrency(offer.total, AssetId.USDC),
            offer.type,
          ],
        }
      })}
    />
  )
}
