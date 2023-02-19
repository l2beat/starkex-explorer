import { Timestamp } from '@explorer/types'
import React from 'react'

import { Asset, assetToInfo } from '../../../utils/assets'
import {
  formatAmount,
  formatWithDecimals,
} from '../../../utils/formatting/formatAmount'
import { formatTimestamp } from '../../../utils/formatting/formatTimestamp'
import { AssetWithLogo } from '../common/AssetWithLogo'
import { Table } from '../common/table/Table'

export interface HomeOfferEntry {
  timestamp: Timestamp
  id: string
  asset: Asset
  amount: bigint
  price: bigint
  totalPrice: bigint
  type: 'BUY' | 'SELL'
}

export interface HomeOffersTableProps {
  offers: HomeOfferEntry[]
}

export function HomeOffersTable(props: HomeOffersTableProps) {
  return (
    <Table
      columns={[
        { header: 'Time' },
        { header: 'Id' },
        { header: 'Asset' },
        { header: 'Amount', numeric: true },
        { header: 'Total price', numeric: true },
        { header: 'Type' },
      ]}
      rows={props.offers.map((offer) => {
        return {
          link: `/offers/${offer.id}`,
          cells: [
            formatTimestamp(offer.timestamp),
            <span className="text-blue-600 underline">#{offer.id}</span>,
            <AssetWithLogo type="small" assetInfo={assetToInfo(offer.asset)} />,
            formatAmount(offer.asset, offer.amount),
            formatWithDecimals(offer.totalPrice, 6, { prefix: '$' }),
            <span className="capitalize">{offer.type.toLowerCase()}</span>,
          ],
        }
      })}
    />
  )
}
